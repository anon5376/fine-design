"use client"

import { Scene, type SceneProps } from "../scene"
import { ease, lerp, progress, spring, springs } from "../clock"
import { measureWordmark, riseOffsets, Wordmark } from "../wordmark"

// S1 Ignition 0.0-2.0, ink. A focus ring draws itself, "fine" rises out of a mask, the ring tightens, and the camera
// dives into the tittle of the i until it fills the frame in paper white: the match cut into S2's paper.
// Beats: 0.5 letters start, 1.0 settled, 1.5 dive begins.

const W = 1920
const H = 1080
const SIZE = 340
const RING_FROM = { w: 1440, h: 640, r: 38 }
const PAD = 64

/** Two halves of a rounded rect, both from top centre, one clockwise one counter, so the ring closes at the bottom. */
function ringHalves(cx: number, cy: number, w: number, h: number, r: number) {
  const l = cx - w / 2, rt = cx + w / 2, tp = cy - h / 2, bt = cy + h / 2
  return [
    `M${cx} ${tp}H${rt - r}A${r} ${r} 0 0 1 ${rt} ${tp + r}V${bt - r}A${r} ${r} 0 0 1 ${rt - r} ${bt}H${cx}`,
    `M${cx} ${tp}H${l + r}A${r} ${r} 0 0 0 ${l} ${tp + r}V${bt - r}A${r} ${r} 0 0 0 ${l + r} ${bt}H${cx}`,
  ]
}

export function S1Ignition({ t }: SceneProps) {
  const m = measureWordmark(SIZE)
  const baseline = H / 2 - (m.ink.top + m.ink.bottom) / 2
  const ox = W / 2 - (m.ink.left + m.ink.right) / 2
  // The tittle in stage coordinates: the dive's target.
  const tx = ox + m.tittle.cx
  const ty = baseline + m.tittle.cy

  // Ring: draws 0.10-0.50, tightens onto the word at 1.2.
  const draw = ease.inOut(progress(t, 0.1, 0.4))
  const tighten = spring(t - 1.2, { visualDuration: 0.34, bounce: 0.2 })
  const tightBox = { w: m.ink.width + PAD * 2, h: -m.ink.top + m.ink.bottom + PAD * 2, r: 22 }
  const w = lerp(RING_FROM.w, tightBox.w, tighten)
  const h = lerp(RING_FROM.h, tightBox.h, tighten)
  const r = lerp(RING_FROM.r, tightBox.r, tighten)
  const [right, left] = ringHalves(W / 2, H / 2, w, h, r)

  // Camera: a slow drift in, then the dive. Scale is geometric so the zoom reads as constant speed per frame.
  const drift = lerp(1, 1.06, ease.inOutSoft(progress(t, 0.1, 1.35)))
  const dive = progress(t, 1.45, 0.5)
  const final = 1.25 * Math.hypot(W / 2, H / 2) / m.tittle.r // 25% more than it takes to cover the corners
  const scale = drift * Math.exp(Math.log(final) * ease.inCubic(dive))
  const pan = ease.inOut(progress(t, 1.45, 0.4))
  const px = lerp(W / 2, tx, pan)
  const py = lerp(H / 2, ty, pan)
  const camera = `translate(${W / 2} ${H / 2}) scale(${scale}) translate(${-px} ${-py})`

  // The tittle pops after the stem is up; it turns paper white as the dive starts.
  const pop = spring(t - 0.66, { visualDuration: 0.36, bounce: 0.42 })
  const white = ease.in(progress(t, 1.45, 0.4)) * 100 // paper white before the frame is full
  const lift = riseOffsets(m, t, 0.45, 0.045, springs.hero)

  return (
    <Scene theme="dark">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="absolute inset-0" style={{ shapeRendering: "geometricPrecision" }}>
        <g transform={camera}>
          {draw > 0 &&
            [right, left].map((d, i) => (
              <path
                key={i}
                d={d}
                pathLength={1}
                fill="none"
                strokeDasharray="1"
                strokeDashoffset={1 - draw}
                style={{ stroke: "var(--ring)", strokeWidth: 2 / drift }}
              />
            ))}
          <Wordmark
            m={m}
            cx={W / 2}
            baseline={baseline}
            lift={lift}
            tittle={{ dy: lift[1], scale: pop, fill: `color-mix(in oklch, var(--foreground) ${100 - white}%, var(--gray-50) ${white}%)` }}
          />
        </g>
      </svg>
    </Scene>
  )
}
