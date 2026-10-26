"use client"

import type { SceneProps } from "@/site/film/scene"
import { ease, lerp, progress } from "@/site/film/clock"
import { FitLayer } from "../s456/fit-layer"

// s5 16.5-19: Fits any width, Poster light. The row is real layout: its width runs 100% -> 52% (t 0-1.25, ease in-out) and back
// (1.25-2.0) and figure-fit alone shrinks and grows the figures. At 2.0 (18.5) the shot crossfades to Poster dark on the moderate tier
// (slowed to 0.2s), same layout, and holds to the cut. s4 is light and this is light, so the cut in is a plain beat cut.
export function S5Fit({ t }: SceneProps) {
  const squeeze = ease.inOut(progress(t, 0, 1.25))
  const release = ease.inOut(progress(t, 1.25, 0.75))
  const frac = lerp(1, 0.52, squeeze) + 0.48 * release // 1 -> .52 -> 1
  const fade = ease.inOut(progress(t, 2.0, 0.2))
  const s = 1 + 0.03 * progress(t, 0, 2.5)
  return (
    <div className="absolute inset-0" style={{ transform: `scale(${s})` }}>
      <FitLayer scheme="light" frac={frac} />
      {t >= 2.0 && (
        <div className="absolute inset-0" style={{ opacity: fade }}>
          <FitLayer scheme="dark" frac={frac} />
        </div>
      )}
    </div>
  )
}
