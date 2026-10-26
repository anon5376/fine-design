"use client"

import type { SceneProps } from "@/site/film/scene"
import { ease, lerp, progress } from "@/site/film/clock"
import { PresetScene } from "../preset-scope"
import { CenterBox } from "../s3/frame"
import { PasswordField } from "../s456/field-shot"
import { Caption, caretOn } from "../s456/shared"

// s4 14-16.5: Forms explain themselves, Folio light. The Field is on screen from the first frame; "hunter2" types, at 15.25 (t 1.25) the
// Field goes invalid and the error appears under the description, which stays. Typing resumes; the 12th character lands at t 1.92 and the
// error leaves at 2.0 (16.0). Camera: a slow push toward the description. s3 ends in Poster dark, so the cut is a wipe: a diagonal
// edge of Folio paper crosses a Poster-dark frame in the first 0.3s (the opening frame is already part-way across, never bare).
// The Field alone fills the frame: it is laid out at its natural width and CSS-zoomed (CenterBox), so the label, the value, the hint
// and the error are drawn at their final size (62px label and value, 88px hint, 68px error on the 1080p frame), not blown up from a small raster.
const W = 408 // the Field's natural width
const H = 150 // its natural height with the error showing: the box is centred on the frame, the Field hangs from its top
const Z = 4 // zoom
const DESC_Y = 102 // natural px from the Field's top to the middle of the description
const TEXT = "hunter2-correct-horse"
const CENTER_Y = 576 // the box's centre on the frame
const P = { x: 960, y: CENTER_Y - (H * Z) / 2 + DESC_Y * Z } // where the description sits, and the camera's centre of push
const LEAN = 240

function typedCount(t: number) {
  if (t < 0.15) return 0
  if (t < 1.4) return Math.min(7, Math.floor((t - 0.15) / 0.085) + 1)
  if (t < 2.0) return Math.min(12, 7 + Math.floor((t - 1.4) / 0.13) + 1)
  return Math.min(21, 12 + Math.floor((t - 2.0) / 0.052) + 1)
}

export function S4Forms({ t }: SceneProps) {
  const n = typedCount(t)
  const typing = n > 0 && (t < 0.15 + 7 * 0.085 + 0.12 || (t >= 1.4 && n < 21))
  const invalid = t >= 1.25 && t < 2.0

  const p = progress(t, 0, 2.5)
  const nudge = Math.sin(Math.PI * progress(t, 1.25, 0.4)) * 0.012 // a small punch as the error lands
  const K = lerp(1, 1.075, ease.inOutSoft(p)) + nudge
  // 2D only: a rotated layer is resampled and softens the type at this scale.
  const camera = `translate(${lerp(-14, 6, ease.out(p))}px, ${lerp(8, -4, ease.out(p))}px) scale(${K})`

  const wipe = ease.out(progress(t, 0, 0.24))
  const x = lerp(0.4, 1, wipe) * (1920 + LEAN)
  const clip = wipe < 1 ? `polygon(0 0, ${x}px 0, ${x - LEAN}px 100%, 0 100%)` : undefined
  const rules = ease.outExpo(progress(t, 0.1, 0.6))

  return (
    <>
      <PresetScene preset="poster" scheme="dark" />
      <div className="absolute inset-0" style={{ clipPath: clip }}>
        <PresetScene preset="folio" scheme="light">
          {[64, 1010].map((y, i) => (
            <div key={y} className="absolute left-0 right-0" style={{ top: y, transformOrigin: i ? "100% 50%" : "0 50%", transform: `scaleX(${rules})` }}>
              <div className="bg-border" style={{ height: 2 }} />
              <div className="bg-border" style={{ height: 1, marginTop: 6 }} />
            </div>
          ))}
          <div className="absolute inset-0" style={{ transform: camera, transformOrigin: `${P.x}px ${P.y}px` }}>
            <div className="absolute left-0 w-full" style={{ top: CENTER_Y - 540, height: 1080 }}>
              <CenterBox w={W} h={H} zoom={Z}>
                <div style={{ width: W }}>
                  <PasswordField value={TEXT.slice(0, n)} invalid={invalid} typing={typing} caret={caretOn(t, typing)} />
                </div>
              </CenterBox>
            </div>
          </div>
          <Caption>FieldDescription</Caption>
        </PresetScene>
      </div>
    </>
  )
}
