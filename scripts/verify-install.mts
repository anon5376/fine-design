// Proves the registry installs into a fresh Next app and looks right (npm run build first; needs network).
//   node scripts/verify-install.mts [--dir <empty dir>]
// Serves out/ on the origin baked into out/r (a deployed https origin is used as is, if it serves the same
// bytes), then in a new temp app: npm install, shadcn init, shadcn add
// select dialog, next build, next start on 4359, and Playwright checks in light, .dark and OS dark.
// Leaves the temp app in place and prints its path. Screenshots → screenshots/install/.
import { spawn, type ChildProcess } from "node:child_process"
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { chromium, type Page } from "@playwright/test"

const root = fileURLToPath(new URL("..", import.meta.url))
const appPort = 4359
const appUrl = `http://localhost:${appPort}`
const children: ChildProcess[] = []

class Fail extends Error {}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))
const read = (path: string) => readFileSync(join(root, path))

// Runs one setup step to completion, printing its output tail only when it fails.
async function step(label: string, cmd: string, args: string[], cwd: string) {
  const started = Date.now()
  process.stdout.write(`${label} ... `)
  const lines: string[] = []
  const child = spawn(cmd, args, { cwd, stdio: ["ignore", "pipe", "pipe"], timeout: 600_000, env: { ...process.env, CI: "1", NEXT_TELEMETRY_DISABLED: "1" } })
  for (const stream of [child.stdout, child.stderr]) stream.on("data", d => lines.push(...String(d).split("\n")))
  const code = await new Promise<number | null>(r => child.on("close", r))
  const seconds = Math.round((Date.now() - started) / 1000)
  if (code !== 0) throw new Fail(`FAIL (${seconds}s)\n${lines.filter(Boolean).slice(-40).join("\n")}\n${label} exited ${code}`)
  console.log(`ok (${seconds}s)`)
}

async function fetchBytes(url: string) {
  const res = await fetch(url, { signal: AbortSignal.timeout(3000) })
  return res.ok ? Buffer.from(await res.arrayBuffer()) : null
}

async function waitFor(url: string, what: string) {
  for (let i = 0; i < 60; i++) {
    if (await fetch(url, { signal: AbortSignal.timeout(2000) }).then(r => r.ok, () => false)) return
    await sleep(500)
  }
  throw new Fail(`${what} did not answer on ${url} within 30s`)
}

// Registry dependencies carry the origin the registry was built with; out/ has to be served exactly there.
async function serveRegistry(): Promise<string> {
  let select: Buffer
  try {
    select = read("out/r/select.json")
  } catch {
    throw new Fail("out/r/select.json is missing. Run npm run build first.")
  }
  const dep: string = JSON.parse(String(select)).registryDependencies[0]
  const origin = new URL(dep).origin
  const { hostname, port } = new URL(origin)
  const url = `${origin}/r/select.json`
  // A deployed registry (REGISTRY_URL=https://… npm run build) is used in place, if it serves this build's bytes.
  if (!["localhost", "127.0.0.1"].includes(hostname)) {
    const served = await fetchBytes(url).catch(() => null)
    if (!served?.equals(select)) throw new Fail(`${url} does not serve this build's out/r/select.json. Deploy out/ there first, or rebuild with the default REGISTRY_URL.`)
    console.log(`registry: using deployed ${origin}`)
    return origin
  }
  if (!port) throw new Fail(`out/r was built for ${origin} without a port; rebuild with the default REGISTRY_URL (http://localhost:4319).`)

  try {
    const served = await fetchBytes(url)
    if (served?.equals(select)) {
      console.log(`registry: reusing ${origin}`)
      return origin
    }
    throw new Fail(`port ${port} is taken by something else (${url} differs from out/r/select.json). Free it or rebuild.`)
  } catch (e) {
    if (e instanceof Fail) throw e
    if ((e as { cause?: { code?: string } }).cause?.code !== "ECONNREFUSED") throw new Fail(`port ${port} is taken by something else (${url}: ${e})`)
  }
  children.push(spawn("node", ["scripts/serve.mjs"], { cwd: root, env: { ...process.env, PORT: port }, stdio: "ignore" }))
  await waitFor(url, "registry server")
  console.log(`registry: started out/ on ${origin}`)
  return origin
}

function appDir() {
  const i = process.argv.indexOf("--dir")
  if (i < 0) return mkdtempSync(join(tmpdir(), "fine-install-"))
  const dir = process.argv[i + 1]
  if (!dir) throw new Fail("--dir needs a path")
  mkdirSync(dir, { recursive: true })
  if (readdirSync(dir).length) throw new Fail(`${dir} is not empty`)
  return dir
}

function write(dir: string, files: Record<string, string>) {
  for (const [name, body] of Object.entries(files)) {
    mkdirSync(join(dir, name, ".."), { recursive: true })
    writeFileSync(join(dir, name), body)
  }
}

// The app as a consumer would have it before shadcn runs: Next, Tailwind v4, Geist, an empty page.
function scaffold(dir: string) {
  const repo = JSON.parse(String(read("package.json")))
  const have = { ...repo.dependencies, ...repo.devDependencies }
  const pick = (names: string[]) =>
    Object.fromEntries(
      names.map(n => {
        if (!have[n]) throw new Fail(`${n} is not in the repo package.json`)
        return [n, have[n]]
      }),
    )
  write(dir, {
    "package.json": JSON.stringify(
      {
        name: "fine-install-proof",
        private: true,
        scripts: { build: "next build", start: "next start" },
        dependencies: pick(["next", "react", "react-dom"]),
        devDependencies: pick(["@tailwindcss/postcss", "@types/node", "@types/react", "@types/react-dom", "postcss", "tailwindcss", "typescript"]),
      },
      null,
      2,
    ),
    "tsconfig.json": JSON.stringify(
      {
        compilerOptions: {
          target: "ES2022", lib: ["dom", "dom.iterable", "esnext"], allowJs: false, skipLibCheck: true, strict: true, noEmit: true,
          module: "esnext", moduleResolution: "bundler", resolveJsonModule: true, isolatedModules: true, jsx: "react-jsx", incremental: true,
          plugins: [{ name: "next" }], paths: { "@/*": ["./*"] }, esModuleInterop: true,
        },
        include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts", ".next/dev/types/**/*.ts"],
        exclude: ["node_modules"],
      },
      null,
      2,
    ),
    "next.config.ts": `import type { NextConfig } from "next"\n\nconst config: NextConfig = {}\n\nexport default config\n`,
    "postcss.config.mjs": `export default { plugins: { "@tailwindcss/postcss": {} } }\n`,
    "app/globals.css": `@import "tailwindcss";\n`,
    "app/layout.tsx": `import type { ReactNode } from "react"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

const sans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" })
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" })

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={\`\${sans.variable} \${mono.variable}\`}>
      <body>{children}</body>
    </html>
  )
}
`,
    "app/page.tsx": `export default function Page() {\n  return <main className="p-8">fine install proof</main>\n}\n`,
  })
}

// Written after the install, since it imports what the registry put in components/ui.
const page = `"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"

const networks = [
  { value: "ethereum", label: "Ethereum" },
  { value: "base", label: "Base" },
  { value: "arbitrum", label: "Arbitrum" },
  { value: "optimism", label: "Optimism" },
]

export default function Page() {
  return (
    <main className="mx-auto grid max-w-md gap-6 p-8">
      <p className="figures text-2xl">1,204.50 USD</p>
      <Input placeholder="Recipient" />
      <Select items={networks} defaultValue="base">
        <SelectTrigger />
        <SelectContent>
          {networks.map(n => (
            <SelectItem key={n.value} value={n.value}>
              {n.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex gap-2">
        <Button>Send</Button>
        <Button variant="outline">Cancel</Button>
        <Button variant="secondary" loading>
          Saving
        </Button>
      </div>
      <Dialog>
        <DialogTrigger render={<Button variant="outline" />}>Rename wallet</DialogTrigger>
        <DialogContent>
          <DialogTitle>Rename wallet</DialogTitle>
          <DialogDescription>Shown on every statement.</DialogDescription>
          <Input defaultValue="Operating" />
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <DialogClose render={<Button />}>Save</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="flex items-center gap-3">
        <div id="palette-probe" className="size-6 bg-blue-500" />
        <div id="dark-probe" className="size-6 bg-white dark:bg-black" />
        <div id="accent-probe" className="size-6 bg-accent" />
      </div>
    </main>
  )
}
`

// Expected values come from the generated tokens, so a token change does not break the proof.
const tokens = JSON.parse(String(read("styles/tokens.json")))
const semantic = (scheme: "light" | "dark") =>
  Object.fromEntries(["background", "surface", "ring", "input", "accent", "primary", "border"].map(k => [`--${k}`, tokens.primitives[tokens.semantic[scheme][k]] ?? tokens.semantic[scheme][k]])) as Record<string, string>
const ms = (v: string) => Math.round(parseFloat(v) * (v.trim().endsWith("ms") ? 1 : 1000))
const moderate = ms(tokens.scalars["duration-moderate"])
const slow = ms(tokens.scalars["duration-slow"])
const popover = tokens.scalars["z-popover"]
const overlay = tokens.scalars["z-overlay"]
const container = `${parseFloat(tokens.theme.radius.container) * 16}px`

const results: boolean[] = []
const check = (name: string, ok: boolean, detail = "") => {
  results.push(ok)
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` -- ${detail}` : ""}`)
}

async function checks(browser: Awaited<ReturnType<typeof chromium.launch>>, label: string, opts: { colorScheme: "light" | "dark"; htmlClass?: string }) {
  const shots = join(root, "screenshots/install")
  const ctx = await browser.newContext({ colorScheme: opts.colorScheme, viewport: { width: 900, height: 700 } })
  const page: Page = await ctx.newPage()
  const errors: string[] = []
  page.on("pageerror", e => errors.push(String(e)))
  page.on("console", m => m.type() === "error" && !m.text().includes("404") && errors.push(m.text())) // 404: favicon
  await page.goto(appUrl)
  if (opts.htmlClass) await page.evaluate(c => document.documentElement.classList.add(c), opts.htmlClass)
  await page.waitForTimeout(400)
  const dark = label.startsWith("dark")
  const css = (sel: string, prop: string) => page.evaluate(([s, p]) => getComputedStyle(document.querySelector(s)!)[p as never] as string, [sel, prop])

  // Compare how the token and the expected literal render, since the browser serializes custom colors its own way.
  const painted = await page.evaluate(want => {
    const canvas = document.createElement("canvas").getContext("2d", { willReadFrequently: true })!
    const rgb = (v: string) => {
      const el = document.createElement("div")
      el.style.background = v
      document.body.append(el)
      const c = getComputedStyle(el).backgroundColor
      el.remove()
      canvas.clearRect(0, 0, 1, 1)
      canvas.fillStyle = "#000"
      canvas.fillStyle = c
      canvas.fillRect(0, 0, 1, 1)
      return [...canvas.getImageData(0, 0, 1, 1).data].slice(0, 3)
    }
    return Object.fromEntries(Object.entries(want).map(([k, lit]) => [k, [rgb(`var(${k})`), rgb(lit)]]))
  }, semantic(dark ? "dark" : "light"))
  for (const [k, [got, exp]] of Object.entries(painted)) check(`${label}: ${k} renders as fine's value`, got.every((c, i) => Math.abs(c - exp[i]) <= 1), `rgb(${got}) vs oklch -> rgb(${exp})`)

  const scalars = await page.evaluate(() => {
    const s = getComputedStyle(document.documentElement)
    return [s.getPropertyValue("--duration-moderate").trim(), s.getPropertyValue("--z-popover").trim()]
  })
  check(`${label}: --duration-moderate ${moderate}ms, --z-popover ${popover}`, ms(scalars[0]) === moderate && scalars[1] === popover, scalars.join())

  const palette = await css("#palette-probe", "backgroundColor")
  check(`${label}: Tailwind palette kept (bg-blue-500)`, palette !== "rgba(0, 0, 0, 0)", palette)
  const probe = await css("#dark-probe", "backgroundColor")
  check(`${label}: dark: variant follows ${opts.htmlClass ? ".dark class" : "OS setting"}`, dark ? /^(rgb\(0, 0, 0\)|oklch\(0 0 0\))/.test(probe) : /^(rgb\(255, 255, 255\)|oklch\(1 0 0\))/.test(probe), probe)
  const accent = await page.evaluate(() => {
    const canvas = document.createElement("canvas").getContext("2d", { willReadFrequently: true })!
    canvas.fillStyle = getComputedStyle(document.querySelector("#accent-probe")!).backgroundColor
    canvas.fillRect(0, 0, 1, 1)
    return [...canvas.getImageData(0, 0, 1, 1).data].slice(0, 3)
  })
  const cobalt = painted["--accent"][1]
  check(`${label}: bg-accent paints fine's --accent (not shadcn's)`, accent.every((c, i) => Math.abs(c - cobalt[i]) <= 1), `rgb(${accent}) vs rgb(${cobalt})`)
  check(`${label}: figures utility is mono tabular`, (await css("p.figures", "fontVariantNumeric")).includes("tabular-nums"), await css("p.figures", "fontFamily"))
  const font = await css("body", "fontFamily")
  check(`${label}: body font-family resolves to Geist`, /geist/i.test(font), font.slice(0, 90))
  const anim = await page.evaluate(() => getComputedStyle(document.querySelector("[data-spinner] path")!).animationName)
  check(`${label}: animate-spinner keyframes present`, anim.includes("spinner-move"), anim)
  await page.screenshot({ path: join(shots, `${label}-closed.png`) })

  // Focus ring on the select trigger via keyboard (input, then trigger).
  await page.keyboard.press("Tab")
  await page.keyboard.press("Tab")
  await page.waitForTimeout(300)
  const ring = await page.evaluate(() => {
    const s = getComputedStyle(document.activeElement!)
    return { tag: document.activeElement!.tagName, width: s.outlineWidth, style: s.outlineStyle, color: s.outlineColor }
  })
  check(`${label}: focus-visible ring 2px solid`, ring.width === "2px" && ring.style === "solid" && !ring.color.includes("/"), JSON.stringify(ring))

  await page.getByRole("combobox").click()
  const listbox = page.getByRole("listbox")
  await listbox.waitFor()
  await page.waitForTimeout(300)
  const sel = await page.evaluate(() => {
    const pop = document.querySelector('[role="listbox"]')!.parentElement!
    const s = getComputedStyle(pop)
    return { cls: pop.className, dur: s.transitionDuration, ease: s.transitionTimingFunction, z: getComputedStyle(pop.parentElement!).zIndex, radius: s.borderRadius }
  })
  check(`${label}: select popup carries popupMotion classes`, sel.cls.includes("ease-spring-moderate") && sel.cls.includes("data-starting-style:opacity-0"), sel.cls.slice(0, 80))
  check(`${label}: select popup transition ${moderate}ms on the spring curve`, sel.dur.split(",").every(d => ms(d) === moderate) && sel.ease.startsWith("linear("), `${sel.dur} ${sel.ease.slice(0, 40)}`)
  check(`${label}: select popup z-index ${popover}, rounded-container ${container}`, sel.z === popover && sel.radius === container, `${sel.z} ${sel.radius}`)
  await page.screenshot({ path: join(shots, `${label}-select-open.png`) })
  await page.keyboard.press("Escape")
  await listbox.waitFor({ state: "detached" })

  await page.getByRole("button", { name: "Rename wallet" }).click()
  const dialog = page.getByRole("dialog")
  await dialog.waitFor()
  await page.waitForTimeout(500)
  const dlg = await page.evaluate(() => {
    const s = getComputedStyle(document.querySelector('[role="dialog"]')!)
    const scrim = document.querySelector("[class*='bg-overlay']")
    return { dur: s.transitionDuration, ease: s.transitionTimingFunction.slice(0, 30), radius: s.borderRadius, overlay: scrim ? getComputedStyle(scrim).backgroundColor : null, overlayZ: scrim ? getComputedStyle(scrim).zIndex : null }
  })
  check(`${label}: dialog opens on slow tier (${slow}ms, spring curve)`, dlg.dur.split(",").every(d => ms(d) === slow) && dlg.ease.startsWith("linear("), `${dlg.dur} ${dlg.ease}`)
  check(`${label}: dialog surface + scrim use tokens`, dlg.radius === container && !!dlg.overlay && dlg.overlay !== "rgba(0, 0, 0, 0)" && dlg.overlayZ === overlay, JSON.stringify(dlg))
  await page.screenshot({ path: join(shots, `${label}-dialog-open.png`) })
  await page.keyboard.press("Escape")
  await dialog.waitFor({ state: "detached" })

  check(`${label}: no page or console errors`, errors.length === 0, errors.join(" | ").slice(0, 200))
  await ctx.close()
}

async function stop(child: ChildProcess) {
  if (child.exitCode !== null || child.signalCode !== null) return
  const exited = new Promise(r => child.once("exit", r))
  child.kill("SIGTERM")
  if ((await Promise.race([exited, sleep(5000).then(() => "timeout")])) === "timeout") child.kill("SIGKILL")
}

let dir = ""
try {
  const origin = await serveRegistry()
  dir = appDir()
  console.log(`consumer app: ${dir}`)
  scaffold(dir)
  const shadcn = join(root, "node_modules/.bin/shadcn")
  const bin = (name: string) => join(dir, "node_modules/.bin", name)

  await step("npm install", "npm", ["install", "--no-audit", "--no-fund"], dir)
  await step("shadcn init", shadcn, ["init", "-d", "-y", "--cwd", dir], dir)
  // -o: init writes its own button.tsx and utils.ts, which fine's items have to replace.
  await step("shadcn add select dialog", shadcn, ["add", `${origin}/r/select.json`, `${origin}/r/dialog.json`, "-y", "-o", "--cwd", dir], dir)
  writeFileSync(join(dir, "app/page.tsx"), page)
  await step("next build", bin("next"), ["build"], dir)

  if (await fetch(appUrl).then(() => true, () => false)) throw new Fail(`port ${appPort} is already in use`)
  children.push(spawn(bin("next"), ["start", "-p", String(appPort)], { cwd: dir, stdio: "ignore" }))
  await waitFor(appUrl, "next start")

  mkdirSync(join(root, "screenshots/install"), { recursive: true })
  const browser = await chromium.launch({ channel: "chrome" })
  try {
    await checks(browser, "light", { colorScheme: "light" })
    await checks(browser, "dark-class", { colorScheme: "light", htmlClass: "dark" })
    await checks(browser, "dark-os", { colorScheme: "dark" })
  } finally {
    await browser.close()
  }
} catch (e) {
  results.push(false)
  console.log(e instanceof Fail ? e.message : e)
} finally {
  for (const child of children) await stop(child)
  if (dir) console.log(`consumer app left in place: ${dir}`)
}

const failed = results.filter(r => !r).length
console.log(failed ? `FAIL: ${failed} of ${results.length} failed` : `PASS: ${results.length} checks`)
process.exit(failed ? 1 : 0)
