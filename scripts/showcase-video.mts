// Records the promo reel of /showcase as 1920x1080, 60fps H.264 (npm run build first; needs ffmpeg).
//   node scripts/showcase-video.mts   → screenshots/x/fine-showcase.mp4 and fine-showcase-poster.png
//   BASE_URL=https://<deployed docs> node scripts/showcase-video.mts   records the deployed site instead of out/
//   KEEP_FRAMES=1 keeps the raw JPEG frames in screenshots/x/frames-showcase for contact sheets.
// Same capture as motion-tour.mts: CDP screencast frames, each held until the next one's timestamp via an ffmpeg
// concat list. The page is 1280x720 at deviceScaleFactor 1.5, so the frames are 1920x1080 and text stays crisp.
// Everything the reel does is a real control on the page. The recorder adds only a cursor (drawn in the page, so
// it exists only in this recording) and the camera (a transform on <body>, eased on Fine's slow tier).
import { spawn, execFileSync } from "node:child_process"
import { copyFileSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { chromium, type CDPSession, type Locator, type Page } from "@playwright/test"

const port = 4351
const base = process.env.BASE_URL?.replace(/\/$/, "") ?? `http://localhost:${port}`
const out = "screenshots/x"
const frameDir = `${out}/frames-showcase`
const ffmpeg = "/opt/homebrew/bin/ffmpeg"
const maxGap = 8 // seconds; a static page is still one frame
const view = { width: 1280, height: 720 }
const server = process.env.BASE_URL ? null : spawn("node", ["scripts/serve.mjs"], { env: { ...process.env, PORT: String(port) }, stdio: "ignore" })
await new Promise(r => setTimeout(r, 500))
// The flag makes the screencast capture at the display's 1.5x; with only the context's deviceScaleFactor Chrome
// still sends 1280x720 frames, which would be upscaled soft.
const browser = await chromium.launch({ channel: "chrome", args: ["--force-device-scale-factor=1.5"] })

// The cursor: an ink dot with a soft ring, on the site's tokens so it reads in both themes. It lives on <html>, outside
// the camera's <body> transform, so it stays one size while the page zooms under it.
const cursorScript = `(() => {
  const css = \`
    html { overflow: hidden }
    #fine-cursor { position: fixed; left: 0; top: 0; z-index: 2147483647; pointer-events: none; opacity: 0; transition: opacity 240ms var(--ease-enter); view-transition-name: fine-cursor }
    #fine-cursor.on { opacity: 1 }
    #fine-cursor i { position: absolute; left: -6px; top: -6px; width: 12px; height: 12px; border-radius: 50%; background: var(--foreground); box-shadow: 0 0 0 2px var(--background); transition: transform 140ms var(--ease-enter) }
    #fine-cursor b { position: absolute; left: -19px; top: -19px; width: 38px; height: 38px; box-sizing: border-box; border-radius: 50%; border: 1.5px solid color-mix(in oklch, var(--foreground) 32%, transparent); background: color-mix(in oklch, var(--foreground) 6%, transparent); transition: transform 180ms var(--ease-enter) }
    #fine-cursor.down i { transform: scale(0.8) }
    #fine-cursor.down b { transform: scale(0.74) }
    ::view-transition-group(fine-cursor) { animation: none }
  \`
  let el
  function install() {
    if (el) return
    const style = document.createElement("style")
    style.textContent = css
    el = document.createElement("div")
    el.id = "fine-cursor"
    el.innerHTML = "<b></b><i></i>"
    document.documentElement.append(style, el)
  }
  const ready = () => document.documentElement.hasAttribute("data-hydrated") && install()
  new MutationObserver(ready).observe(document, { attributes: true, subtree: true, attributeFilter: ["data-hydrated"] })
  addEventListener("DOMContentLoaded", ready)
  const put = (x, y) => el && (el.style.transform = "translate(" + x + "px," + y + "px)")
  addEventListener("mousemove", e => put(e.clientX, e.clientY), true)
  addEventListener("mousedown", () => el?.classList.add("down"), true)
  addEventListener("mouseup", () => el?.classList.remove("down"), true)
  window.__cursor = (on, x, y) => {
    install()
    if (x !== undefined) put(x, y)
    el.classList.toggle("on", on)
  }
  try { localStorage.setItem("theme", "light") } catch {}
})()`

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

// The editor's clock: scene starts are stamped in real time and matched to frame timestamps afterwards.
const marks: { name: string; at: number }[] = []
const mark = (name: string) => marks.push({ name, at: Date.now() / 1000 })

type Point = { x: number; y: number }
let pos: Point = { x: 760, y: 470 }

/** Cursor travel: ease-in-out, with a slight bow like a hand, timed in real time with many small moves. */
async function glide(page: Page, to: Point) {
  const from = pos
  const dx = to.x - from.x
  const dy = to.y - from.y
  const dist = Math.hypot(dx, dy) || 1
  const ms = Math.min(700, Math.max(350, 300 + dist * 0.55))
  const t0 = performance.now()
  for (;;) {
    const raw = Math.min((performance.now() - t0) / ms, 1)
    const e = raw < 0.5 ? 4 * raw ** 3 : 1 - (-2 * raw + 2) ** 3 / 2
    const bow = Math.sin(Math.PI * e) * 0.05 * dist
    await page.mouse.move(from.x + dx * e - (dy / dist) * bow, from.y + dy * e + (dx / dist) * bow)
    if (raw >= 1) break
    await sleep(5)
  }
  pos = to
}

async function center(target: Locator, at = { x: 0.5, y: 0.5 }): Promise<Point> {
  const box = await target.boundingBox()
  if (!box) throw new Error("no box")
  return { x: box.x + box.width * at.x, y: box.y + box.height * at.y }
}

async function point(page: Page, target: Locator, at?: { x: number; y: number }) {
  await glide(page, await center(target, at))
}

async function click(page: Page, target: Locator, at?: { x: number; y: number }) {
  await point(page, target, at)
  await sleep(120)
  await page.mouse.down()
  await sleep(80)
  await page.mouse.up()
}

/** Human cadence: uneven gaps, a little slower at the start of a word. Seeded, so every render types the same. */
let seed = 7
const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647
async function type(page: Page, text: string) {
  for (const ch of text) {
    await page.keyboard.type(ch)
    await sleep(75 + rand() * 80)
  }
}

type Rect = { x: number; y: number; width: number; height: number }
/** Camera: a window onto the page (any width, 16:9), kept inside the page unless `free`. Eases on the slow tier's spring, and never changes what is clickable. */
async function camera(page: Page, on: { box?: Rect; at?: Point; width: number; lift?: number; free?: boolean } | null, ms = 1100) {
  let transform = "none"
  if (on) {
    const s = view.width / on.width
    const h = on.width * (view.height / view.width)
    // Either centred on a box, or with its top-left corner placed at `at`.
    let x = on.at?.x ?? on.box!.x + on.box!.width / 2 - on.width / 2
    let y = on.at?.y ?? on.box!.y + on.box!.height / 2 - h / 2 + (on.lift ?? 0)
    if (!on.free) {
      x = Math.min(Math.max(x, 0), view.width - on.width)
      y = Math.min(Math.max(y, 0), view.height - h)
    }
    transform = `translate(${(-x * s).toFixed(2)}px, ${(-y * s).toFixed(2)}px) scale(${s.toFixed(4)})`
  }
  await page.evaluate(
    ([t, d]) => {
      const b = document.body
      b.style.transformOrigin = "0 0"
      b.style.transition = `transform ${d}ms var(--ease-spring-slow)`
      b.style.transform = t
    },
    [transform, ms] as const,
  )
  await sleep(ms + 80)
}

async function record(page: Page, cdp: CDPSession, run: () => Promise<void>) {
  const frames: { data: Buffer; time: number }[] = []
  cdp.on("Page.screencastFrame", ({ data, metadata, sessionId }) => {
    frames.push({ data: Buffer.from(data, "base64"), time: metadata.timestamp ?? Date.now() / 1000 })
    cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {})
  })
  // 1280x720 CSS at 1.5x: frames arrive at exactly 1920x1080.
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 92, everyNthFrame: 1, maxWidth: 1920, maxHeight: 1080 })
  await run()
  await page.waitForTimeout(300)
  await cdp.send("Page.stopScreencast")
  return frames
}

function encode(frames: { data: Buffer; time: number }[], mp4: string) {
  rmSync(frameDir, { recursive: true, force: true })
  mkdirSync(frameDir, { recursive: true })
  const list = frames.map(({ data }, i) => {
    writeFileSync(`${frameDir}/${String(i).padStart(5, "0")}.jpg`, data)
    const gap = i + 1 < frames.length ? frames[i + 1].time - frames[i].time : 0.5
    return `file '${String(i).padStart(5, "0")}.jpg'\nduration ${Math.min(Math.max(gap, 0.001), maxGap).toFixed(3)}`
  })
  list.push(`file '${String(frames.length - 1).padStart(5, "0")}.jpg'`) // concat drops the last duration without a repeat
  writeFileSync(`${frameDir}/list.txt`, list.join("\n") + "\n")
  execFileSync(ffmpeg, ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", `${frameDir}/list.txt`,
    // JPEG frames are full-range BT.601; X and phones expect limited-range BT.709 yuv420p and the index up front.
    "-vf", "fps=60,scale=1920:1080:flags=bicubic:in_range=full:out_range=tv:in_color_matrix=bt601:out_color_matrix=bt709,format=yuv420p",
    "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-profile:v", "high", "-pix_fmt", "yuv420p",
    "-color_range", "tv", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
    "-movflags", "+faststart", mp4])
}

async function reel(page: Page) {
  const dialog = (name: string) => page.getByRole("dialog", { name })
  const balance = page.getByText("Available balance").locator("..")
  const sync = page.getByRole("button", { name: "Sync transfers" })

  // 1. A transfer arrives: toast on the expressive tier, the balance rolls up. Then once more, close up.
  mark("open")
  await page.mouse.move(pos.x, pos.y)
  await page.evaluate(([x, y]) => (window as any).__cursor(true, x, y), [pos.x, pos.y])
  await sleep(600)
  mark("incoming transfer")
  await click(page, sync)
  await sleep(1100)
  mark("balance close-up")
  await camera(page, { box: (await balance.boundingBox())!, width: 700 }, 800)
  await click(page, sync)
  await sleep(850)
  await camera(page, null, 800)
  await sleep(150)

  // 2. Command palette, New transfer, the form.
  mark("command palette")
  await page.keyboard.press("ControlOrMeta+k")
  await sleep(600)
  await type(page, "new")
  await sleep(400)
  await page.keyboard.press("Enter")
  await dialog("New transfer").waitFor()
  await sleep(250)
  mark("new transfer form")
  await camera(page, { box: (await dialog("New transfer").boundingBox())!, width: 920, lift: 20 }, 800)
  await click(page, dialog("New transfer").getByRole("combobox", { name: "Recipient" }))
  await sleep(150)
  await type(page, "pie")
  await sleep(300)
  await click(page, page.getByRole("option", { name: "Pied Piper" }))
  await sleep(250)
  await click(page, dialog("New transfer").getByRole("combobox", { name: "Network" }))
  await sleep(300)
  await point(page, page.getByRole("option", { name: "SEPA" }))
  await sleep(150)
  await click(page, page.getByRole("option", { name: "Wire" }))
  await sleep(250)
  await click(page, dialog("New transfer").getByRole("textbox", { name: "Amount" }))
  await sleep(150)
  await type(page, "6400.00")
  await sleep(550)
  mark("poster")
  // Pull back just enough to hold the dialog, the balance behind it and the toast's corner in one shot.
  await camera(page, { at: { x: 224, y: 128 }, width: 1040 }, 800)
  await click(page, dialog("New transfer").getByRole("button", { name: "Send" }))
  mark("send")
  await dialog("New transfer").waitFor({ state: "hidden" })
  await sleep(1200)
  await camera(page, null, 800)
  await sleep(150)

  // 3. Filters drawer: tags leave, siblings glide, the slider glides to the press.
  mark("filters drawer")
  await click(page, page.getByRole("button", { name: "Filters" }))
  await dialog("Filters").waitFor()
  await sleep(350)
  await camera(page, { at: { x: 640, y: 0 }, width: 640 }, 800)
  await click(page, page.getByRole("button", { name: "Remove Pending" }))
  await sleep(650)
  const track = dialog("Filters").locator(".h-1.bg-secondary")
  mark("slider glide")
  await click(page, track, { x: 0.7, y: 0.5 })
  await sleep(750)
  await click(page, dialog("Filters").getByRole("button", { name: "Close" }))
  await camera(page, null, 800)
  await sleep(500)

  // 4. Tabs and sidebar, then the dark beat.
  mark("tabs")
  await click(page, page.getByRole("tab", { name: "Incoming" }))
  await sleep(600)
  mark("sidebar")
  await point(page, page.getByRole("link", { name: "Transfers" }))
  await sleep(100)
  await point(page, page.getByRole("link", { name: "Wallets" }))
  await sleep(100)
  await point(page, page.getByRole("link", { name: "Team" }))
  await sleep(150)
  mark("dark mode")
  await click(page, page.getByRole("button", { name: /^Theme:/ }))
  await sleep(900)
  await click(page, page.getByRole("tab", { name: "All" }))
  await sleep(450)
  await point(page, page.getByRole("link", { name: "Invoices" }))
  await sleep(100)
  await point(page, page.getByRole("link", { name: "Overview" }))
  await sleep(300)

  // 5. Close on the wordmark and the repo.
  mark("closing")
  await glide(page, { x: 1110, y: 560 })
  await page.evaluate(() => (window as any).__cursor(false))
  const footer = page.locator("footer")
  // End card: everything but the footer fades out while the camera centres on it.
  await page.evaluate(ms => {
    const end = document.querySelector<HTMLElement>("footer")!
    end.style.transition = `border-color ${ms}ms var(--ease-exit)`
    end.style.borderColor = "transparent"
    for (let el: HTMLElement | null = end; el && el !== document.body; el = el.parentElement) {
      for (const sib of Array.from(el.parentElement?.children ?? [])) {
        if (sib === el || !(sib instanceof HTMLElement)) continue
        sib.style.transition = `opacity ${ms}ms var(--ease-exit)`
        sib.style.opacity = "0"
      }
    }
  }, 700)
  await camera(page, { box: (await footer.boundingBox())!, width: 640, free: true }, 1200)
  await sleep(2000)
}

rmSync(`${out}/fine-showcase.mp4`, { force: true })
mkdirSync(out, { recursive: true })
try {
  const context = await browser.newContext({ viewport: view, deviceScaleFactor: 1.5, colorScheme: "light", reducedMotion: "no-preference" })
  await context.addInitScript(cursorScript)
  const page = await context.newPage()
  const problems: string[] = []
  page.on("console", m => m.type() === "error" && problems.push(m.text()))
  page.on("pageerror", e => problems.push(String(e)))
  page.on("response", r => r.status() >= 400 && problems.push(`${r.status()} ${r.url()}`))
  const cdp = await context.newCDPSession(page)
  await page.goto(`${base}/showcase/`)
  await page.locator("html[data-hydrated]").waitFor({ state: "attached" })
  await page.waitForTimeout(600)
  const frames = await record(page, cdp, () => reel(page))
  await context.close()

  const t0 = frames[0].time
  const span = frames[frames.length - 1].time - t0
  encode(frames, `${out}/fine-showcase.mp4`)

  const at = (name: string) => marks.find(m => m.name === name)!.at
  const poster = frames.reduce((best, f, i) => (Math.abs(f.time - at("poster")) < Math.abs(frames[best].time - at("poster")) ? i : best), 0)
  execFileSync(ffmpeg, ["-y", "-loglevel", "error", "-i", `${frameDir}/${String(poster).padStart(5, "0")}.jpg`, "-update", "1", "-frames:v", "1", `${out}/fine-showcase-poster.png`])
  if (!process.env.KEEP_FRAMES) rmSync(frameDir, { recursive: true, force: true })
  else copyFileSync(`${frameDir}/list.txt`, `${frameDir}/list.keep.txt`)

  console.log(`${frames.length} frames over ${span.toFixed(1)}s (${(frames.length / span).toFixed(1)}/s captured)`)
  for (const m of marks) console.log(`${(m.at - t0).toFixed(1).padStart(5)}s  ${m.name}`)
  if (problems.length) console.log("console errors:", problems)
} finally {
  await browser.close()
  server?.kill()
}
console.log("done")
