"use client"

import type { SceneProps } from "@/site/film/scene"
import { ease, lerp, progress, spring, springs, type SpringSpec } from "@/site/film/clock"
import { riseOffsets, Wordmark } from "@/site/film/wordmark"
import { Figures, measureLockup, type FigureLayer } from "../lockup"
import { PresetScene, PresetScope } from "../preset-scope"
import type { PresetId } from "../presets"

// S7 Out 21.5-24.0, ink. The s1 lockup re-forms with 0.3: letters rise out of their masks, the tittle drops onto the i, the figures rise
// behind it, the cobalt underline draws (done on the 22.0 beat). Then it steps to Folio's plum on 22.0 and Poster's magenta on 22.5 and
// settles back on cobalt, landing on 23.0, where everything stops: the URL is typed by 22.9 and the last second is fully still (no drift,
// no caret). Each colour is the real dark accent of its preset, from a scope of its own.

const W = 1920
const H = 1080
const SIZE = 380
const URL_TEXT = "github.com/anon5376/fine-design"
const URL_SIZE = 46
const TYPE_AT = 0.55 // 22.05
const CPS = 40
const HOLD = 1.5 // 23.0
// The moderate tier slowed to read at film scale (0.16s -> 0.24s), for the underline's colour steps.
const STEP: SpringSpec = { visualDuration: 0.24, bounce: 0 }
const MUTED = "var(--muted-foreground)"

/** The closing scene for any version: the first two characters of `version` ("0.") stay muted, the rest are foreground. Film 0.4 passes "0.4". */
export function OutScene({ t, version = "0.3" }: SceneProps & { version?: string }) {
  const gapUrl = SIZE * 0.26
  const L = measureLockup(SIZE, version, gapUrl + URL_SIZE * 0.72)
  const { word: m, underline: u, figures: f } = L
  const lineY = u.y

  // The rise runs 0.14s ahead of the scene clock (the springs leave their start slowly), so the first frame already has the f
  // coming up out of its mask: the cut from s6 is ink to ink and must not land on an empty frame.
  const k = t + 0.14
  const lift = riseOffsets(m, k, 0, 0.045, springs.hero)
  // The tittle falls in from above once the stem is up, with the same overshoot as the first film's ending.
  const drop = spring(k - 0.3, { visualDuration: 0.5, bounce: 0.38 })
  const dotDy = lerp(-(m.tittle.cy + L.baseline + 80), 0, drop) + lift[1]
  const layers: FigureLayer[] = [...version].map((ch, i) => ({
    index: i,
    ch,
    dy: lerp(f.cellH, 0, spring(k - 0.2 - i * 0.05, springs.hero)),
    fill: i < 2 ? MUTED : "var(--foreground)",
  }))

  const draw = ease.inOut(progress(t, 0.1, 0.4))
  // Plum lands over cobalt at 0.5 (22.0); magenta over plum at 1.0 (22.5); at 1.25 magenta fades out to cobalt, done at the hold.
  const plum = t < 1 ? spring(t - 0.5, STEP) : t < 1.25 ? 1 : 0
  const magenta = t < 1.25 ? spring(t - 1, STEP) : 1 - spring(t - 1.25, STEP)

  const typed = Math.max(0, Math.min(URL_TEXT.length, Math.floor((t - TYPE_AT) * CPS)))
  const typing = t >= TYPE_AT && typed < URL_TEXT.length
  const caret = t >= TYPE_AT && t < HOLD && (typing || Math.floor(t * 4) % 2 === 0)

  const push = 1 + 0.03 * ease.out(progress(t, 0, HOLD))
  const line = (preset: PresetId, opacity: number) =>
    opacity > 0 && (
      <PresetScope preset={preset} scheme="dark" className="absolute inset-0" style={{ opacity }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="absolute inset-0">
          <rect x={u.x} y={lineY} width={u.w * draw} height={u.h} style={{ fill: "var(--accent)" }} />
        </svg>
      </PresetScope>
    )

  return (
    <PresetScene preset="ledger" scheme="dark">
      <div className="absolute inset-0" style={{ transform: `scale(${push})`, transformOrigin: "50% 50%" }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="absolute inset-0" style={{ shapeRendering: "geometricPrecision" }}>
          <Wordmark m={m} cx={L.wordCx} baseline={L.baseline} lift={lift} tittle={{ dy: dotDy, scale: drop > 0 ? 1 : 0 }} />
          <Figures lockup={L} layers={layers} />
          {draw > 0 && <rect x={u.x} y={lineY} width={u.w * draw} height={u.h} style={{ fill: "var(--accent)" }} />}
        </svg>
        {line("folio", plum)}
        {line("poster", magenta)}
        <div
          className="absolute inset-x-0 text-center font-mono text-muted-foreground"
          style={{ top: lineY + u.h + gapUrl - URL_SIZE * 0.1, fontSize: URL_SIZE, lineHeight: 1.2, letterSpacing: 0 }}
        >
          <span className="inline-block whitespace-pre text-left" style={{ width: `${URL_TEXT.length}ch` }}>
            {URL_TEXT.slice(0, typed)}
            <span className="inline-block bg-foreground align-text-bottom" style={{ width: 4, height: URL_SIZE * 1.05, marginLeft: 3, marginRight: -7, opacity: caret ? 1 : 0 }} />
          </span>
        </div>
      </div>
    </PresetScene>
  )
}

export function S7Out(props: SceneProps) {
  return <OutScene {...props} />
}
