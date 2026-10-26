"use client"

import { ease, progress, spring, type SpringSpec } from "@/site/film/clock"
import { Wordmark } from "@/site/film/wordmark"
import { Figures, measureLockup, type FigureLayer } from "@/site/film03/lockup"
import { PresetScene, PresetScope } from "@/site/film03/preset-scope"
import type { PresetId } from "@/site/film03/presets"

// Shot 14, 23.0-27.0 (shot time 0-4), ink. One continuous lockup: film 0.3's version scene and its closing scene, composed without the re-forming between them.
// 0.0  the cut from the wall: "fine 0.3" settled, the cobalt underline drawn; the camera is already creeping in, so no frame is still.
// 0.5  (23.5) the 3 rolls up a line into a 4 (moderate, slowed, a hint of overshoot), lands in the accent and settles to foreground; the camera pushes with it.
// 1.0  (24.0) plum lands over the underline, 1.5 (24.5) magenta over plum, 2.0 (25.0) back to cobalt: each preset's own dark accent, from a scope of its own.
// 1.7-2.5  the URL types on below the lockup (24.7 to 25.5). From 2.5 (25.5) the picture holds to the end, under a push too slow to read as a move.
// The lockup starts centred on the frame and rises (1.2-1.9, in-out) to where it sits with the URL under it, so the frame is full from the cut and the line types into place.

const W = 1920
const H = 1080
const SIZE = 380
const URL_TEXT = "github.com/anon5376/fine-design"
const URL_SIZE = 56
const CPS = 40
const ROLL: SpringSpec = { visualDuration: 0.32, bounce: 0.28 }
const EXIT = 0.24
const STEP: SpringSpec = { visualDuration: 0.24, bounce: 0 }
const PUSH: SpringSpec = { visualDuration: 0.5, bounce: 0 }
const MUTED = "var(--muted-foreground)"
const CHANGE = 0.5
const PLUM = 1.0
const MAGENTA = 1.5
const BACK = 2.0
const TYPE_AT = 1.7
const HOLD = 2.5
const RISE = { at: 1.2, dur: 0.7 }

export function LockupOut({ t, from = "0.3", to = "0.4" }: { t: number; from?: string; to?: string }) {
  const gapUrl = SIZE * 0.26
  const below = gapUrl + URL_SIZE * 0.72
  const L = measureLockup(SIZE, from)
  // How far the centred lockup rises to make room for the URL: the difference between the two layouts' baselines.
  const rise = (measureLockup(SIZE, from, below).baseline - L.baseline) * ease.inOut(progress(t, RISE.at, RISE.dur))
  const { word: m, underline: u, figures: f } = L
  const last = from.length - 1

  const out = progress(t, CHANGE, EXIT)
  const layers: FigureLayer[] = [...from.slice(0, last)].map((ch, index) => ({ index, ch, fill: MUTED }))
  if (out < 1) layers.push({ index: last, ch: from[last], dy: -ease.exit(out) * f.cellH, opacity: 1 - ease.exit(out), fill: MUTED })
  if (t >= CHANGE) {
    const settle = ease.inOut(progress(t, CHANGE + 0.3, 0.7))
    layers.push({
      index: last,
      ch: to[last],
      dy: (1 - spring(t - CHANGE, ROLL)) * f.cellH,
      opacity: ease.enter(progress(t, CHANGE, 0.32)),
      fill: `color-mix(in oklch, var(--accent) ${(1 - settle) * 100}%, var(--foreground))`,
    })
  }

  // Plum lands over cobalt on 24.0, magenta over plum on 24.5; on 25.0 magenta gives way to the cobalt underneath and plum is already gone behind it.
  const plum = t < BACK ? spring(t - PLUM, STEP) : 0
  const magenta = t < BACK ? spring(t - MAGENTA, STEP) : 1 - spring(t - BACK, STEP)

  const typed = Math.max(0, Math.min(URL_TEXT.length, Math.floor((t - TYPE_AT) * CPS)))
  const typing = t >= TYPE_AT && typed < URL_TEXT.length
  const caret = t >= TYPE_AT && t < HOLD && (typing || Math.floor(t * 4) % 2 === 0)

  // A slow creep the whole way, a push that lands with the roll, and a creep through the hold too slow to read as a move.
  const scale = 1 + 0.035 * ease.out(progress(t, 0, HOLD)) + 0.03 * spring(t - CHANGE, PUSH) + 0.006 * progress(t, HOLD, 1.5)
  const line = (preset: PresetId, opacity: number) =>
    opacity > 0 && (
      <PresetScope preset={preset} scheme="dark" className="absolute inset-0" style={{ opacity }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="absolute inset-0">
          <rect x={u.x} y={u.y} width={u.w} height={u.h} style={{ fill: "var(--accent)" }} />
        </svg>
      </PresetScope>
    )

  return (
    <PresetScene preset="ledger" scheme="dark">
      <div className="absolute inset-0" style={{ transform: `scale(${scale})`, transformOrigin: `${W / 2}px ${H / 2}px` }}>
        <div className="absolute inset-0" style={{ transform: `translateY(${rise}px)` }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="absolute inset-0" style={{ shapeRendering: "geometricPrecision" }}>
          <Wordmark m={m} cx={L.wordCx} baseline={L.baseline} lift={[0, 0, 0, 0]} tittle={{}} />
          <Figures lockup={L} layers={layers} />
          <rect x={u.x} y={u.y} width={u.w} height={u.h} style={{ fill: "var(--accent)" }} />
        </svg>
        {line("folio", plum)}
        {line("poster", magenta)}
        <div className="absolute inset-x-0 text-center font-mono text-muted-foreground" style={{ top: u.y + u.h + gapUrl - URL_SIZE * 0.1, fontSize: URL_SIZE, lineHeight: 1.2, letterSpacing: 0 }}>
          <span className="inline-block whitespace-pre text-left" style={{ width: `${URL_TEXT.length}ch` }}>
            {URL_TEXT.slice(0, typed)}
            <span className="inline-block bg-foreground align-text-bottom" style={{ width: 4, height: URL_SIZE * 1.05, marginLeft: 3, marginRight: -7, opacity: caret ? 1 : 0 }} />
          </span>
        </div>
        </div>
      </div>
    </PresetScene>
  )
}
