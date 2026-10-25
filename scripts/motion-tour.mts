// Records the motion in the docs as video (npm run build first; needs ffmpeg for the .mp4).
//   node scripts/motion-tour.mts   → screenshots/motion/tour-1x.mp4 and tour-0.25x.mp4
// Frames come from Chrome's CDP screencast (it keeps delivering across page.goto), which only
// emits on paint; each frame is held until the next one's timestamp via an ffmpeg concat list.
// The slowed pass sets Chrome's animation playback rate, which slows CSS transitions and
// Web Animations; Motion's JS-driven springs (the hover highlight's size) still run at 1x.
import { spawn, execFileSync } from "node:child_process"
import { mkdirSync, rmSync, writeFileSync } from "node:fs"
import { chromium, type CDPSession, type Page } from "@playwright/test"

const port = 4349
const base = `http://localhost:${port}`
const out = "screenshots/motion"
const ffmpeg = "/opt/homebrew/bin/ffmpeg"
const maxGap = 8 // seconds; a static page is still one frame
const server = spawn("node", ["scripts/serve.mjs"], { env: { ...process.env, PORT: String(port) }, stdio: "ignore" })
await new Promise(r => setTimeout(r, 500))
const browser = await chromium.launch({ channel: "chrome" })

let slow: (() => Promise<unknown>) | null = null

async function record(page: Page, cdp: CDPSession, run: () => Promise<void>) {
  const frames: { data: Buffer; time: number }[] = []
  cdp.on("Page.screencastFrame", ({ data, metadata, sessionId }) => {
    frames.push({ data: Buffer.from(data, "base64"), time: metadata.timestamp ?? Date.now() / 1000 })
    cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {})
  })
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 85, everyNthFrame: 1, maxWidth: 1280, maxHeight: 800 })
  await run()
  await page.waitForTimeout(300)
  await cdp.send("Page.stopScreencast")
  return frames
}

function encode(frames: { data: Buffer; time: number }[], dir: string, mp4: string) {
  mkdirSync(dir, { recursive: true })
  const list = frames.map(({ data }, i) => {
    writeFileSync(`${dir}/${String(i).padStart(5, "0")}.jpg`, data)
    const gap = i + 1 < frames.length ? frames[i + 1].time - frames[i].time : 0.5
    return `file '${String(i).padStart(5, "0")}.jpg'\nduration ${Math.min(Math.max(gap, 0.001), maxGap).toFixed(3)}`
  })
  list.push(`file '${String(frames.length - 1).padStart(5, "0")}.jpg'`) // concat drops the last duration without a repeat
  writeFileSync(`${dir}/list.txt`, list.join("\n") + "\n")
  execFileSync(ffmpeg, ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", `${dir}/list.txt`,
    "-vf", "fps=30,scale=trunc(iw/2)*2:trunc(ih/2)*2", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", mp4])
}

async function open(page: Page, path: string) {
  await page.goto(base + path)
  await page.locator("html[data-hydrated]").waitFor({ state: "attached" })
  await slow?.() // the playback rate does not survive navigation
  await page.waitForTimeout(300)
}

async function tour(page: Page, beat: number) {
  const pause = (n = 1) => page.waitForTimeout(beat * n)

  await open(page, "/components/button/")
  for (const name of ["Text", "Heading", "Icon", "Separator", "Button", "Input", "Select", "Checkbox"]) {
    await page.locator("aside nav").getByRole("link", { name, exact: true }).hover()
    await pause(0.6)
  }
  const primary = page.locator("main section button").first()
  await primary.hover()
  await pause()
  await page.mouse.down()
  await pause()
  await page.mouse.up()
  await pause()

  await open(page, "/components/checkbox/")
  await page.locator("main [role=checkbox]").first().click()
  await pause()
  await page.locator("main [role=checkbox]").first().click()
  await pause()
  await open(page, "/components/radio/")
  for (const i of [0, 2, 1]) {
    await page.locator("main [role=radio]").nth(i).click()
    await pause()
  }
  await open(page, "/components/switch/")
  await page.locator("main [role=switch]").nth(1).click()
  await pause()
  await page.locator("main [role=switch]").nth(1).click()
  await pause()

  await open(page, "/components/select/")
  await page.getByRole("combobox", { name: "Network" }).first().click()
  await pause()
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press("ArrowDown")
    await pause(0.8)
  }
  await page.keyboard.press("Enter")
  await pause()

  await open(page, "/components/dropdown-menu/")
  await page.getByRole("button", { name: "Invoice actions" }).click()
  await pause()
  for (const name of [/Edit/, /Duplicate/, /Move to/]) {
    await page.getByRole("menuitem", { name }).hover()
    await pause(0.8)
  }
  await page.getByRole("menuitem", { name: "Sent" }).hover()
  await pause()
  await page.keyboard.press("Escape")
  await page.keyboard.press("Escape")
  await pause()

  await open(page, "/components/tooltip/")
  for (const name of ["Bold", "Italic", "Underline"]) {
    await page.getByRole("button", { name }).hover()
    await pause(1.2)
  }

  await open(page, "/components/dialog/")
  await page.getByRole("button", { name: "Rename wallet" }).click()
  await pause(1.5)
  await page.keyboard.press("Escape")
  await pause()

  await open(page, "/components/drawer/")
  await page.getByRole("button", { name: "Filters" }).click()
  await pause(1.5)
  await page.keyboard.press("Escape")
  await pause()

  await open(page, "/components/toast/")
  for (const name of ["Success", "Error", "Plain"]) {
    await page.getByRole("button", { name }).click()
    await pause(0.8)
  }
  await pause(1.5)

  await open(page, "/components/command-palette/")
  await page.keyboard.press("ControlOrMeta+k")
  await pause()
  for (const key of ["ArrowDown", "ArrowDown", "ArrowDown"]) {
    await page.keyboard.press(key)
    await pause(0.6)
  }
  await page.keyboard.type("set", { delay: 80 })
  await pause()
  await page.keyboard.press("Escape")
  await pause()

  await open(page, "/components/progress/")
  await pause(4)

  await open(page, "/tokens/")
  const play = page.getByRole("button", { name: "Play" })
  await play.scrollIntoViewIfNeeded()
  await pause()
  await play.click()
  await pause(2)
  await play.click()
  await pause(2)
}

mkdirSync(out, { recursive: true })
try {
  for (const [label, rate] of [["1x", 1], ["0.25x", 0.25]] as const) {
    const dir = `${out}/frames-${label}`
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
    const page = await context.newPage()
    const cdp = await context.newCDPSession(page)
    if (rate !== 1) {
      await cdp.send("Animation.enable")
      slow = () => cdp.send("Animation.setPlaybackRate", { playbackRate: rate })
    } else slow = null
    const frames = await record(page, cdp, () => tour(page, rate === 1 ? 500 : 1400))
    await context.close()
    encode(frames, dir, `${out}/tour-${label}.mp4`)
    rmSync(dir, { recursive: true, force: true })
  }
} finally {
  await browser.close()
  server.kill()
}
console.log("done")
