// Deterministic render of /film ("timesnap" style): a virtual clock replaces performance.now, Date.now, rAF and the timers,
// every Web Animation is paused and positioned from it, and each frame is captured only after React has committed.
//   node scripts/render-film.mts                              full film, 60fps capture, encoded 1:1 (crisp, no frame mixing) -> screenshots/x/fine-film.mp4
//   node scripts/render-film.mts --from 2 --to 5 --out <dir>/s2.mp4   a partial (same frames the full render would have)
//   node scripts/render-film.mts --stills 1.0,1.5,1.9 --out <dir>      full-size PNGs at those film times, no video
// Flags: --fps 60 (capture rate, a multiple of 60; the video is 60fps. 60 = one capture per video frame, crisp, no temporal blur.
//        Higher multiples average fps/60 captures per frame into a shutter blur and ghost fast moves: leave it at 60 unless you want that)
//        --png (lossless frames)
//        --keep-frames (leave <out>-frames/) --url <base> (a running dev server, e.g. http://localhost:4361) --port 4361
// Serves out/ with scripts/serve.mjs unless --url is given (npm run build first; needs ffmpeg at /opt/homebrew/bin).
import { spawn, execFileSync } from "node:child_process"
import { mkdirSync, rmSync, writeFileSync, readdirSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { tmpdir } from "node:os"
import { chromium } from "@playwright/test"

const args = process.argv.slice(2)
const flag = (name: string) => args.includes(`--${name}`)
const opt = (name: string) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : undefined
}
const DURATION = 23
const fps = Number(opt("fps") ?? 60)
const from = Number(opt("from") ?? 0)
const to = Number(opt("to") ?? DURATION)
const stills = opt("stills")?.split(",").map(Number)
const png = flag("png") || !!stills
const partial = from !== 0 || to !== DURATION
const outArg = opt("out") ?? (partial || stills ? join(tmpdir(), "fine-film") : "screenshots/x/fine-film.mp4")
const port = Number(opt("port") ?? 4361)
const ffmpeg = "/opt/homebrew/bin/ffmpeg"
const dt = 1000 / fps
const sub = fps / 60
if (!Number.isInteger(sub) || sub < 1) throw new Error("--fps must be a multiple of 60")

// Runs before any page script. The page sees only this clock; the renderer's own waits use the saved real timers.
const virtualClock = `(() => {
  const real = { setTimeout: setTimeout.bind(window), raf: requestAnimationFrame.bind(window) }
  let now = 0
  let seq = 1
  const timers = new Map()
  let frames = []
  performance.now = () => now
  Date.now = () => 1.7e12 + now
  const addTimer = (fn, delay, args, repeat) => {
    const id = seq++
    const ms = Math.max(0, Number(delay) || 0)
    timers.set(id, { id, fn, args, at: now + ms, every: repeat ? Math.max(1, ms) : 0 })
    return id
  }
  window.setTimeout = (fn, delay, ...args) => addTimer(fn, delay, args, false)
  window.setInterval = (fn, delay, ...args) => addTimer(fn, delay, args, true)
  window.clearTimeout = window.clearInterval = id => { timers.delete(id) }
  window.requestAnimationFrame = fn => { const id = seq++; frames.push({ id, fn }); return id }
  window.cancelAnimationFrame = id => { frames = frames.filter(f => f.id !== id) }
  window.requestIdleCallback = fn => addTimer(() => fn({ didTimeout: false, timeRemaining: () => 8 }), 1, [], false)
  window.cancelIdleCallback = window.clearTimeout

  // Web Animations and CSS transitions run on the document timeline (real time): pin each to the virtual clock.
  const seen = new WeakMap()
  // Motion stamps WAAPI animations with startTime = performance.now() (virtual) while the document timeline is real, so
  // they were already finished at first sight. Record the virtual start and give the browser an equivalent real one.
  const startDesc = Object.getOwnPropertyDescriptor(Animation.prototype, "startTime")
  Object.defineProperty(Animation.prototype, "startTime", {
    configurable: true,
    get() { return startDesc.get.call(this) },
    set(v) {
      if (typeof v === "number") {
        seen.set(this, { start: v })
        const real = document.timeline.currentTime
        startDesc.set.call(this, typeof real === "number" ? real - (now - v) : v)
      } else startDesc.set.call(this, v)
    },
  })
  const freeze = () => {
    for (const a of document.getAnimations()) {
      if (a.playState === "finished" || a.playState === "idle") continue
      let rec = seen.get(a)
      if (!rec) seen.set(a, (rec = { start: now }))
      const rate = a.playbackRate || 1
      const elapsed = (now - rec.start) * rate
      const end = a.effect ? a.effect.getComputedTiming().endTime : Infinity
      if (rate > 0 && Number.isFinite(end) && elapsed >= end) { a.finish(); continue }
      a.pause()
      a.currentTime = rate > 0 ? elapsed : end + elapsed
    }
  }
  const fireTimers = () => {
    for (let guard = 0; guard < 1000; guard++) {
      let next
      for (const t of timers.values()) if (t.at <= now && (!next || t.at < next.at || (t.at === next.at && t.id < next.id))) next = t
      if (!next) return
      if (next.every) next.at += next.every
      else timers.delete(next.id)
      try { typeof next.fn === "function" ? next.fn(...next.args) : 0 } catch (e) { console.error(e) }
    }
  }
  const tick = () => new Promise(r => real.setTimeout(r, 0))
  window.__film = {
    // One virtual step: timers, then animation frames, then let React and Motion settle on real macrotasks, then pin animations.
    async frame(ms) {
      now += ms
      fireTimers()
      const run = frames
      frames = []
      for (const f of run) { try { f.fn(now) } catch (e) { console.error(e) } }
      for (let i = 0; i < 4; i++) await tick()
      freeze()
      await tick()
    },
    async skip(n, ms) { for (let i = 0; i < n; i++) await this.frame(ms) },
    paint: () => new Promise(r => real.raf(() => real.raf(r))),
    now: () => now,
  }
})()`

const server = opt("url") ? null : spawn("node", ["scripts/serve.mjs"], { env: { ...process.env, PORT: String(port) }, stdio: "ignore" })
const base = (opt("url") ?? `http://localhost:${port}`).replace(/\/$/, "")
await new Promise(r => setTimeout(r, 600))

const browser = await chromium.launch({ channel: "chrome", args: ["--font-render-hinting=none", "--disable-lcd-text", "--force-device-scale-factor=1", "--hide-scrollbars"] })
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 })
page.on("pageerror", e => console.error("pageerror:", e.message))
page.on("console", m => m.type() === "error" && console.error("console:", m.text().slice(0, 300)))
await page.addInitScript(virtualClock)
const cdp = await page.context().newCDPSession(page)

const outDir = stills ? resolve(outArg) : dirname(resolve(outArg))
const mp4 = stills ? "" : resolve(outArg.endsWith(".mp4") ? outArg : join(outArg, `film-${from}-${to}.mp4`))
const frameDir = stills ? outDir : mp4.replace(/\.mp4$/, "-frames")
rmSync(frameDir, { recursive: !stills, force: true })
mkdirSync(frameDir, { recursive: true })
mkdirSync(dirname(mp4 || frameDir), { recursive: true })

try {
  await page.goto(`${base}/film/?render=1`, { waitUntil: "load" })
  await page.waitForFunction(() => document.querySelector('[data-film-ready="true"]'), null, { polling: 100, timeout: 60000 })
  const origin = await page.evaluate(() => (window as any).__film.now())
  if (origin !== 0) throw new Error(`virtual clock moved before the film started (${origin}ms)`)

  const shot = async (file: string) => {
    await page.evaluate(() => (window as any).__film.paint())
    const { data } = await cdp.send("Page.captureScreenshot", png ? { format: "png" } : { format: "jpeg", quality: 95, optimizeForSpeed: true })
    writeFileSync(file, Buffer.from(data, "base64"))
  }

  const t0 = Date.now()
  await page.evaluate(() => (window as any).__film.frame(0)) // paints t = 0
  if (stills) {
    let k = 0
    for (const s of stills.sort((a, b) => a - b)) {
      const target = Math.round(s * fps)
      if (target > k) await page.evaluate(([n, ms]) => (window as any).__film.skip(n, ms), [target - k, dt])
      k = target
      await shot(join(frameDir, `still-${s.toFixed(3)}.png`))
      console.log(`still ${s}s`)
    }
  } else {
    const kFrom = Math.round(from * fps)
    const kTo = Math.round(to * fps)
    if (kFrom > 0) await page.evaluate(([n, ms]) => (window as any).__film.skip(n, ms), [kFrom, dt])
    for (let k = kFrom; k < kTo; k++) {
      if (k > kFrom) await page.evaluate(ms => (window as any).__film.frame(ms), dt)
      await shot(join(frameDir, `${String(k - kFrom).padStart(5, "0")}.${png ? "png" : "jpg"}`))
      if ((k - kFrom) % 120 === 0) console.log(`t=${(k / fps).toFixed(2)}s  ${((Date.now() - t0) / 1000).toFixed(0)}s elapsed`)
    }
    const count = readdirSync(frameDir).filter(f => /^\d+\.(jpg|png)$/.test(f)).length
    if (count !== kTo - kFrom) throw new Error(`frame count ${count}, expected ${kTo - kFrom}`)
    // Output is 60fps. At the default fps 60 (sub = 1) every capture is one video frame, 1:1. With --fps 120/240, video frame j =
    // mean of the `sub` captures sub*j .. sub*j+sub-1 (tmix + select): a shutter blur that leaves stepped echoes on fast moves.
    const ext = png ? "png" : "jpg"
    const scale = png ? "scale=1920:1080:in_range=full:out_range=tv:out_color_matrix=bt709" : "scale=1920:1080:in_range=full:out_range=tv:in_color_matrix=bt601:out_color_matrix=bt709"
    execFileSync(ffmpeg, ["-y", "-loglevel", "error", "-framerate", String(fps), "-i", `${frameDir}/%05d.${ext}`,
      "-vf", `${scale},format=yuv420p${sub > 1 ? `,tmix=frames=${sub},select='eq(mod(n,${sub}),${sub - 1})'` : ""},setpts=N/(60*TB)`, "-r", "60",
      "-c:v", "libx264", "-profile:v", "high", "-preset", "slow", "-crf", "16", "-pix_fmt", "yuv420p",
      "-color_range", "tv", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-movflags", "+faststart", "-an", mp4])
    if (!flag("keep-frames")) rmSync(frameDir, { recursive: true, force: true })
    console.log(`${kTo - kFrom} frames -> ${mp4}`)
  }
} finally {
  await browser.close()
  server?.kill()
}
