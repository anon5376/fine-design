// Builds the launch assets the README and the repository listings use (npm run build first; needs ffmpeg).
//   node scripts/launch-assets.mts gif       docs/demo.gif                    the first 9.9s of the launch film, 720px at 14fps (needs screenshots/x/fine-film.mp4: node scripts/render-film.mts)
//   node scripts/launch-assets.mts themes    docs/themes.png                  /showcase/ in Ledger, Folio and Poster, three panels, 2400x475
//   node scripts/launch-assets.mts preview   docs/social-preview.png          1280x640: the wordmark over a strip of the same three shots
//   node scripts/launch-assets.mts icon      plugin/.claude-plugin/icon.png   512x512, the wordmark
//   node scripts/launch-assets.mts all       all four
//   --out <dir> writes demo.gif, themes.png, social-preview.png and icon.png into <dir> instead of their places in the repo.
// The three shots are /showcase/ at 1200px, 2x, light, each preset chosen through localStorage as a visitor's choice is.
// The wordmark is the film's end card: Geist 600, tracking -0.04em, kerning off, a cobalt underline the width of the word's
// ink. It is set on a sheet laid over a docs page, so the Geist that next/font already declares is the one measured and drawn.
// Screenshots are recompressed through ffmpeg (mixed prediction, level 9): same pixels, smaller files.
import { spawn, execFileSync } from "node:child_process"
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { basename, dirname, join } from "node:path"
import { chromium, type Browser } from "@playwright/test"

const args = process.argv.slice(2)
const outAt = args.indexOf("--out")
const outDir = outAt >= 0 ? args[outAt + 1] : undefined
const names = outAt < 0 ? args : args.filter((_, i) => i !== outAt && i !== outAt + 1)
const commands = ["gif", "themes", "preview", "icon"] as const
type Command = (typeof commands)[number]
const wanted = names.includes("all") ? [...commands] : commands.filter(c => names.includes(c))
if (!wanted.length || (outAt >= 0 && !outDir)) {
  console.error("usage: node scripts/launch-assets.mts gif|themes|preview|icon|all [--out <dir>]")
  process.exit(1)
}

const target: Record<Command, string> = {
  gif: "docs/demo.gif",
  themes: "docs/themes.png",
  preview: "docs/social-preview.png",
  icon: "plugin/.claude-plugin/icon.png",
}
// Where an asset goes; its folder is made.
function place(c: Command) {
  const file = outDir ? join(outDir, basename(target[c])) : target[c]
  mkdirSync(dirname(file), { recursive: true })
  return file
}

const ffmpeg = "/opt/homebrew/bin/ffmpeg"
const film = "screenshots/x/fine-film.mp4"
const port = 4371
const base = `http://localhost:${port}`
const colors = { ink: "#0b0d0d", paper: "#f0f3f2", cobalt: "#6ea7fc" }
const presetIds = ["ledger", "folio", "poster"] as const
const tmp = mkdtempSync(join(tmpdir(), "fine-launch-"))

const run = (...argv: string[]) => execFileSync(ffmpeg, ["-y", "-loglevel", "error", ...argv])
const onePng = ["-compression_level", "9", "-pred", "mixed", "-frames:v", "1", "-update", "1"]

function buildGif() {
  if (!existsSync(film)) throw new Error(`${film} is missing: run node scripts/render-film.mts first`)
  // One palette from every frame (stats_mode=full), sierra2_4a dither, only the changed rectangle between frames.
  const filter = "fps=14,scale=720:-1:flags=lanczos,split[a][b];[a]palettegen=stats_mode=full[p];[b][p]paletteuse=dither=sierra2_4a:diff_mode=rectangle"
  const file = place("gif")
  run("-t", "9.9", "-i", film, "-vf", filter, file)
  console.log(file)
}

// The three shots, 2400x1640 each; themes and preview share them within one run.
let shots: Buffer[] | null = null
async function shootThemes(browser: Browser) {
  if (shots) return shots
  shots = []
  for (const preset of presetIds) {
    const context = await browser.newContext({ viewport: { width: 1200, height: 820 }, deviceScaleFactor: 2, colorScheme: "light" })
    await context.addInitScript(
      ([id]) => {
        if (id === "ledger") localStorage.removeItem("preset")
        else localStorage.setItem("preset", id)
        localStorage.setItem("theme", "light")
      },
      [preset],
    )
    const page = await context.newPage()
    await page.goto(`${base}/showcase/`)
    await page.locator("html[data-hydrated]").waitFor({ state: "attached" })
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(1500)
    const applied = await page.evaluate(() => document.documentElement.getAttribute("data-preset") ?? "ledger")
    if (applied !== preset) throw new Error(`asked for ${preset}, the page is ${applied}`)
    shots.push(await page.screenshot())
    await context.close()
  }
  return shots
}

function buildThemes(shot: Buffer[]) {
  // Each shot scaled to 792px wide and cropped to 475 high, with 12px of Folio's border grey between the panels.
  shot.forEach((buf, i) => writeFileSync(`${tmp}/shot-${i}.png`, buf))
  const filter = [
    "color=c=0xdedcd8:s=2400x475:r=1:d=1[bg]",
    ...shot.map((_, i) => `[${i}]scale=792:-1:flags=lanczos,crop=792:475:0:0[p${i}]`),
    "[bg][p0]overlay=0:0[t0]",
    "[t0][p1]overlay=804:0[t1]",
    "[t1][p2]overlay=1608:0,format=rgb24",
  ].join(";")
  const file = place("themes")
  run(...shot.flatMap((_, i) => ["-i", `${tmp}/shot-${i}.png`]), "-filter_complex", filter, ...onePng, file)
  console.log(file)
}

type Wordmark = { size: number; width: number; height: number; paper: string; cobalt: string }

// Runs in the page: draws the word into #mark, an svg `width` by `height`, once Geist is loaded.
async function drawWordmark({ size, width, height, paper, cobalt }: Wordmark) {
  const track = -0.04
  await document.fonts.load(`600 ${size}px Geist`)
  await document.fonts.ready
  const ctx = document.createElement("canvas").getContext("2d")!
  ctx.font = `600 ${size}px Geist`
  ctx.fontKerning = "none"
  let x = 0
  const glyphs = [..."fine"].map(ch => {
    const g = { ch, x }
    x += ctx.measureText(ch).width + track * size
    return g
  })
  const ink = (ch: string) => {
    const m = ctx.measureText(ch)
    return { left: -m.actualBoundingBoxLeft, right: m.actualBoundingBoxRight, up: m.actualBoundingBoxAscent }
  }
  const left = glyphs[0].x + ink("f").left
  const right = glyphs[3].x + ink("e").right
  const ascent = Math.max(ink("f").up, ink("i").up)
  const gap = ascent * 0.232
  const thick = Math.max(2, Math.round(ascent * 0.06))
  const baseline = Math.round((height - (ascent + gap + thick)) / 2 + ascent)
  const offset = width / 2 - (left + right) / 2
  const ns = "http://www.w3.org/2000/svg"
  const svg = document.querySelector("#mark")!
  for (const g of glyphs) {
    const text = document.createElementNS(ns, "text")
    text.setAttribute("x", String(offset + g.x))
    text.setAttribute("y", String(baseline))
    text.setAttribute("style", `font:600 ${size}px Geist;font-kerning:none;fill:${paper};text-rendering:geometricPrecision`)
    text.textContent = g.ch
    svg.append(text)
  }
  const rule = document.createElementNS(ns, "rect")
  rule.setAttribute("x", String(offset + left))
  rule.setAttribute("width", String(right - left))
  rule.setAttribute("y", String(baseline + gap))
  rule.setAttribute("height", String(thick))
  rule.setAttribute("style", `fill:${cobalt}`)
  svg.append(rule)
}

// An ink sheet laid over a docs page (which has declared Geist), photographed alone, then recompressed into `file`.
async function photograph(browser: Browser, file: string, width: number, height: number, markup: string, mark: Wordmark) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 })
  await page.goto(`${base}/`)
  await page.locator("html[data-hydrated]").waitFor({ state: "attached" })
  await page.addStyleTag({ content: "html { overflow: hidden }" })
  await page.evaluate(html => {
    const sheet = document.createElement("div")
    sheet.style.cssText = "position:fixed;inset:0;z-index:2147483647;overflow:hidden"
    sheet.innerHTML = html
    document.body.append(sheet)
  }, markup)
  await page.evaluate(drawWordmark, mark)
  await page.waitForTimeout(300)
  writeFileSync(`${tmp}/sheet.png`, await page.screenshot())
  await page.close()
  run("-i", `${tmp}/sheet.png`, ...onePng, file)
  console.log(file)
}

async function buildPreview(browser: Browser, shot: Buffer[]) {
  const widths = [422, 422, 420]
  const cells = shot
    .map((buf, i) => `<div style="width:${widths[i]}px;height:268px;overflow:hidden;background:#fff"><img alt="" style="display:block;width:422px;max-width:none;height:auto" src="data:image/png;base64,${buf.toString("base64")}"></div>`)
    .join("")
  const markup = `<div style="width:1280px;height:640px;background:${colors.ink}">
    <svg id="mark" width="1280" height="373" viewBox="0 0 1280 373" style="position:absolute;inset:0"></svg>
    <div style="position:absolute;left:0;bottom:0;width:1280px;height:268px;display:flex;gap:8px">${cells}</div>
  </div>`
  await photograph(browser, place("preview"), 1280, 640, markup, { size: 230, width: 1280, height: 373, ...colors })
}

async function buildIcon(browser: Browser) {
  const markup = `<div style="width:512px;height:512px;background:${colors.ink}"><svg id="mark" width="512" height="512" viewBox="0 0 512 512" style="position:absolute;inset:0"></svg></div>`
  await photograph(browser, place("icon"), 512, 512, markup, { size: 204, width: 512, height: 512, ...colors })
}

const needsBrowser = wanted.some(c => c !== "gif")
const server = needsBrowser ? spawn("node", ["scripts/serve.mjs"], { env: { ...process.env, PORT: String(port) }, stdio: "ignore" }) : null
if (server) await new Promise(r => setTimeout(r, 500))
const browser = needsBrowser ? await chromium.launch({ channel: "chrome" }) : null

try {
  if (wanted.includes("gif")) buildGif()
  if (wanted.includes("themes")) buildThemes(await shootThemes(browser!))
  if (wanted.includes("preview")) await buildPreview(browser!, await shootThemes(browser!))
  if (wanted.includes("icon")) await buildIcon(browser!)
} finally {
  await browser?.close()
  server?.kill()
  rmSync(tmp, { recursive: true, force: true })
}
