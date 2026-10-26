"use client"

import type { SceneProps } from "@/site/film/scene"
import { clamp, ease, lerp, progress } from "@/site/film/clock"
import { follow, path } from "../camera"
import { macro as autoHeight } from "../macros/auto-height"
import { macro as checklist } from "../macros/checklist"
import { macro as stepper } from "../macros/stepper"
import { Shot } from "../shot"
import { macroTime } from "../time"
import { Title } from "../transitions"

// B setup, 4.0-8.5 (group time 0-4.5): shots 3 to 5, hard cuts, all light to light (the whip into shot 2 lands on Ledger paper, shot 6 opens on Folio paper).
// Shot 3, Stepper, 4.0-5.5, Poster light: marker, step title and Continue in one row at zoom 7.5, tilting down the column with the ring.
//   4.2 click 1, 4.85 click 2 (the macro's clicks are 0.6 s apart; a short slow patch between them puts both on the storyboard's beats).
//   5.1-5.5 the camera eases back to all four steps. Title "Stepper" rises at 4.2 (risen by 4.6) at the bottom right, below Continue and clear of the column at every tilt.
// Shot 4, Checklist, 5.5-7.0, Folio light: zoom 13.5 on "Verify your email", the checkbox at the left edge.
//   5.7 check, 5.86 the strike sweeps the label (the camera trucks a little with its front), 6.2 the item glides to the end, 6.2-6.6 pull back, Title "Checklist" rises at 5.7 (risen by 6.1) top-left; the camera sits 40px low so the first row clears it.
// Shot 5, AutoHeight, 7.0-8.5, Ledger light: zoom 4.8 all the way (the card's 14px text is 67px), the card right of centre, the closed card's lower edge in the lower third.
//   7.25 toggle, the camera follows 0.646 of the growing bottom edge down so Street and City come up under it and the open card ends filling the frame's height.
//   Title "AutoHeight" rises at 7.2 (risen by 7.6) in the left 560px, which the card never enters.
// Beats: 4.2 click, 4.85 click, 5.1 pull-back, 5.7 check, 6.2 glide and pull-back, 7.25 toggle, 8.5 cut.

const mix = lerp

/** A short spring-like kick on a beat: 0 before, up to 1 at the beat and back to 0 over `len` seconds. */
const kick = (t: number, at: number, len = 0.3) => Math.sin(Math.PI * ease.out(progress(t, at, len))) ** 1.5

function StepperShot({ t }: { t: number }) {
  // Macro time: starts 0.05 in so click 1 lands at 0.2; between 0.7 and 0.85 it runs at two thirds so click 2 (macro 0.85) lands at 0.85.
  const mt = (s: number) => (s <= 0.7 ? s + 0.05 : s < 0.85 ? 0.75 + (s - 0.7) * (2 / 3) : s)
  const ring = (s: number) => stepper.content.anchors(mt(s), "poster").ring
  // The camera trails the ring down the column, and its tilt follows how far down it is: looking up at Shipping, level at Payment, down on Review.
  const view = (s: number) => {
    const f = follow(ring, s, 0.16)
    const down = clamp((f.y - 61) / 96)
    return {
      zoom: 7.2 * (1 + 0.1 * progress(s, 0, 1.1)),
      focus: { x: 134, y: f.y },
      at: { x: 960, y: mix(430, 560, down) },
      rx: mix(-13, 12, down),
      ry: mix(-17, -9, down),
      p: 1700,
      rz: mix(-1.5, 1, down),
      push: 1 - 0.03 * kick(s, 0.2) - 0.03 * kick(s, 0.85),
    }
  }
  const cam = path(t, view, [{ t: 1.0, dur: 0.4, ease: ease.inOut, to: { zoom: 4.4, focus: { x: 136, y: 86 }, at: { x: 1020, y: 440 }, rx: 2, ry: -6, rz: 0 } }])
  return (
    <Shot preset="poster" scheme="light" t={macroTime(mt(t))} content={stepper.content} cam={cam}>
      <Title text="Stepper" t={t} at={0.2} preset="poster" scheme="light" size={170} x={1824} y={870} align="right" />
    </Shot>
  )
}

function ChecklistShot({ t }: { t: number }) {
  const mt = (s: number) => macroTime(s, { from: 0.05 })
  const a = (s: number) => checklist.content.anchors(mt(s), "folio")
  const view = (s: number) => {
    const front = follow(x => a(x).strikeFront, s, 0.08)
    return {
      zoom: 10.6 * (1 + 0.11 * ease.out(progress(s, 0, 0.7))),
      focus: { x: 50.3 + 0.12 * (front.x - 66.3), y: 36 },
      at: { x: 130, y: 560 },
      rx: -2,
      ry: -8,
      rz: mix(-2.2, 0, ease.out(progress(s, 0, 0.6))),
      push: 1 - 0.03 * kick(s, 0.2),
    }
  }
  const cam = path(t, view, [{ t: 0.65, dur: 0.4, ease: ease.inOut, to: { zoom: 6.6, focus: { x: 130, y: 55 }, at: { x: 1100, y: 650 }, rx: 1, ry: -4, rz: 0 } }])
  const drift = progress(t, 1.05, 0.45)
  return (
    <Shot preset="folio" scheme="light" t={mt(t)} content={checklist.content} cam={{ ...cam, ry: (cam.ry ?? 0) + 2 * drift, push: (cam.push ?? 1) + 0.02 * drift }}>
      <Title text="Checklist" t={t} at={0.2} preset="folio" scheme="light" size={176} x={90} y={24} />
    </Shot>
  )
}

function AutoHeightShot({ t }: { t: number }) {
  const bottom = (s: number) => autoHeight.content.anchors(macroTime(s), "ledger").bottom
  // Zoom 4.8 puts the open card (288x214 px) at 1382x1027 on the frame and its 14px text at 67px. The card sits right, so the left 560px are the title's column
  // at every moment. The focus follows 0.646 of the growing bottom edge: the closed card's bottom edge is at 790 (lower third), the open card ends 21 to 1048.
  const view = (s: number) => {
    const b = follow(bottom, s, 0.1)
    return {
      zoom: 4.8 * (1 + 0.02 * progress(s, 0.3, 1.2)),
      focus: { x: 144, y: 62 + 0.646 * (b.y - 62) },
      at: { x: 1270, y: 790 },
      rx: mix(-4, 2, ease.inOut(progress(s, 0.25, 0.6))),
      ry: 2,
      rz: mix(-1.2, 0, ease.out(progress(s, 0, 0.9))),
      push: 1 - 0.025 * kick(s, 0.25),
    }
  }
  return (
    <Shot preset="ledger" scheme="light" t={macroTime(t)} content={autoHeight.content} cam={view(t)}>
      <Title text="AutoHeight" t={t} at={0.2} preset="ledger" scheme="light" size={88} x={48} y={96} />
    </Shot>
  )
}

export function BSetup({ t }: SceneProps) {
  if (t < 1.5) return <StepperShot key="stepper" t={t} />
  if (t < 3) return <ChecklistShot key="checklist" t={t - 1.5} />
  return <AutoHeightShot key="auto-height" t={t - 3} />
}
