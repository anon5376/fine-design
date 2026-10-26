"use client"

import type { SceneProps } from "@/site/film/scene"
import { ease, lerp, progress, spring, type SpringSpec } from "@/site/film/clock"
import { Wordmark } from "@/site/film/wordmark"
import { Figures, measureLockup, type FigureLayer } from "../lockup"
import { PresetScene } from "../preset-scope"

// S1 0.2 to 0.3, 0.0-2.5, ink. The lockup is already settled at frame 0: the word, its cobalt underline, and "0.2" in muted figures.
// At 0.75 the 2 rolls up a line into a 3 (AnimatedNumber's roll: the glyph slides a full line out, the next slides in from below, "0."
// stays put) and the 3 lands in the accent, then settles to foreground. 1.5-2.5 the camera pushes in; from 2.0 the underline floods
// the frame in Ledger's paper, so the cut at 2.5 is paper to paper (s2 opens on that paper). Beats: 0.75 roll, 1.5 push, 2.5 cut.

const W = 1920
const H = 1080
const SIZE = 380
const CHANGE = 0.75
// The moderate roll slowed to read at film scale (spring 0.16s -> 0.32s), with a hint of overshoot. The exit is the tier's tween (0.12s -> 0.24s).
const ROLL: SpringSpec = { visualDuration: 0.32, bounce: 0.28 }
const EXIT = 0.24
const WIPE = { start: 2.02, dur: 0.42 }
const MUTED = "var(--muted-foreground)"

export function S1Version({ t }: SceneProps) {
  const L = measureLockup(SIZE, "0.2")
  const { underline: u, figures: f } = L

  const out = progress(t, CHANGE, EXIT)
  const layers: FigureLayer[] = [
    { index: 0, ch: "0", fill: MUTED },
    { index: 1, ch: ".", fill: MUTED },
  ]
  if (out < 1) layers.push({ index: 2, ch: "2", dy: -ease.exit(out) * f.cellH, opacity: 1 - ease.exit(out), fill: MUTED })
  if (t >= CHANGE) {
    const settle = ease.inOut(progress(t, CHANGE + 0.3, 0.7))
    layers.push({
      index: 2,
      ch: "3",
      dy: (1 - spring(t - CHANGE, ROLL)) * f.cellH,
      opacity: ease.enter(progress(t, CHANGE, 0.32)),
      fill: `color-mix(in oklch, var(--accent) ${(1 - settle) * 100}%, var(--foreground))`,
    })
  }

  // A drift so no frame is frozen, then the push-in that lands on the cut.
  const scale = 1 + 0.015 * progress(t, 0, 1.5) + 0.135 * ease.inOutSoft(progress(t, 1.5, 1))
  const camera = `translate(${W / 2} ${H / 2}) scale(${scale}) translate(${-W / 2} ${-H / 2})`

  // The underline is the wipe: it widens to the frame first, then floods up and down, and turns from cobalt to paper (gray-50 is
  // Ledger's light background) before it is large. Everything is in camera space, and the camera never shows beyond the stage.
  const wipe = progress(t, WIPE.start, WIPE.dur)
  const across = ease.outCubic(progress(wipe, 0, 0.6))
  const flood = ease.in(progress(wipe, 0.1, 0.9))
  const paper = ease.in(progress(wipe, 0.25, 0.5))
  const bleed = 4
  const x0 = lerp(u.x, -bleed, across)
  const x1 = lerp(u.x + u.w, W + bleed, across)
  const y0 = lerp(u.y, -bleed, flood)
  const y1 = lerp(u.y + u.h, H + bleed, flood)

  return (
    <PresetScene preset="ledger" scheme="dark">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="absolute inset-0" style={{ shapeRendering: "geometricPrecision" }}>
        <g transform={camera}>
          <Wordmark m={L.word} cx={L.wordCx} baseline={L.baseline} lift={[0, 0, 0, 0]} tittle={{}} />
          <Figures lockup={L} layers={layers} />
          {wipe > 0 ? (
            <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} style={{ fill: `color-mix(in oklch, var(--accent) ${(1 - paper) * 100}%, var(--gray-50))` }} />
          ) : (
            <rect x={u.x} y={u.y} width={u.w} height={u.h} style={{ fill: "var(--accent)" }} />
          )}
        </g>
      </svg>
    </PresetScene>
  )
}
