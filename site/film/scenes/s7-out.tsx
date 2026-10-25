"use client"

import { Scene, type SceneProps } from "../scene"
import { ease, lerp, progress, spring, springs } from "../clock"
import { fontStack, measureWordmark, riseOffsets, Wordmark } from "../wordmark"

// S7 Out 19.5-23.0, ink. "fine" re-forms, the tittle drops onto the i, a cobalt underline draws, the repo URL types on.
// Everything settles by 22.4; the last 0.6s is fully still (no drift, no caret).

const W = 1920
const H = 1080
const SIZE = 340
const URL_TEXT = "github.com/anon5376/fine-design"
const URL_SIZE = 52
const START = 0.1 // 19.6
const CPS = 30

export function S7Out({ t }: SceneProps) {
  const m = measureWordmark(SIZE)
  // Layout: word ink, underline, URL as one group centred on the frame.
  const gapLine = SIZE * 0.17
  const lineH = Math.round(SIZE * 0.04)
  const gapUrl = SIZE * 0.26
  const inkH = -m.ink.top
  const groupH = inkH + gapLine + lineH + gapUrl + URL_SIZE * 0.72
  const baseline = H / 2 - groupH / 2 + inkH
  const ox = W / 2 - (m.ink.left + m.ink.right) / 2

  const lift = riseOffsets(m, t, START, 0.045, springs.hero)
  // The tittle falls in from above once the stem is up, with the same overshoot.
  const drop = spring(t - (START + 0.34), { visualDuration: 0.5, bounce: 0.38 })
  const dotDy = lerp(-(m.tittle.cy + baseline + 80), 0, drop) + lift[1]

  const line = ease.inOut(progress(t, 0.9, 0.5))
  const lineY = baseline + gapLine

  const typed = Math.max(0, Math.min(URL_TEXT.length, Math.floor((t - 1.4) * CPS)))
  const typing = t >= 1.4 && typed < URL_TEXT.length
  // 2Hz caret: solid while typing, blinking after, gone when the hold begins at 22.4 (t = 2.9).
  const caret = t >= 1.4 && t < 2.9 && (typing || Math.floor(t * 4) % 2 === 0)

  const push = 1 + 0.035 * ease.out(progress(t, START, 2.8 - START))

  return (
    <Scene theme="dark">
      <div className="absolute inset-0" style={{ transform: `scale(${push})`, transformOrigin: "50% 50%" }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="absolute inset-0" style={{ shapeRendering: "geometricPrecision" }}>
          <Wordmark m={m} cx={W / 2} baseline={baseline} lift={lift} tittle={{ dy: dotDy, scale: drop > 0 ? 1 : 0 }} />
          {line > 0 && <rect x={ox + m.ink.left} y={lineY} width={m.ink.width * line} height={lineH} style={{ fill: "var(--accent)" }} />}
        </svg>
        <div
          className="absolute inset-x-0 text-center text-muted-foreground"
          style={{ top: lineY + lineH + gapUrl - URL_SIZE * 0.1, fontFamily: fontStack("mono"), fontSize: URL_SIZE, lineHeight: 1.2, letterSpacing: 0 }}
        >
          <span className="inline-block whitespace-pre text-left" style={{ width: `${URL_TEXT.length}ch` }}>
            {URL_TEXT.slice(0, typed)}
            <span className="inline-block bg-foreground align-text-bottom" style={{ width: 4, height: URL_SIZE * 1.05, marginLeft: 3, marginRight: -7, opacity: caret ? 1 : 0 }} />
          </span>
        </div>
      </div>
    </Scene>
  )
}
