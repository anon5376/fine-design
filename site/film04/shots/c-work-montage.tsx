"use client"

import { cn } from "@/lib/utils"
import { ease, progress } from "@/site/film/clock"
import { Caption } from "@/site/film03/s456/shared"
import type { PresetId, Scheme } from "@/site/film03/presets"
import { macro as asyncStatus } from "../macros/async-status"
import { macro as checklist } from "../macros/checklist"
import { macro as copyButton } from "../macros/copy-button"
import { macro as otp } from "../macros/otp-input"
import { macro as stepper } from "../macros/stepper"
import type { ContentOptions, MacroDef } from "../macros/kit"
import { Shot } from "../shot"
import { RATE, macroTime } from "../time"

// Shot 8 of c-work, the check montage, 11.5-13.5 (shot time 0-2): eight cuts of 0.25 s, one graphic match cut each. In every cut a real check draws at the
// frame's centre at the same size, at fine's own tier speeds (RATE.real) so each completes inside its 0.25 s: the cut lands on the macro's last pre-check
// frames (`from`, a hair before the check starts) and the check is drawn by about 0.1 s. The schemes alternate on purpose; the last cut is dark, so the cut
// into the ReactionButton is dark to dark. Each cut pushes in from 1 to 1.05 on the same curve, so the match holds and the camera never rests.

/** The check's drawn width on the frame, px. A check is a path of `glyph` component px across, so the zoom is CHECK_PX / glyph, the same screen size in every cut. */
const CHECK_PX = 336
/** The OtpInput cut has no check; its success border around a digit is framed at this slot height instead, on slot 2 so the first three slots sit about the centre. */
const SLOT_PX = 360
const CUT = 0.25
// Path widths of each component's check, in component px, trimmed so the inked check (stroke caps included) measures the same 420px on the frame at the end of
// its cut, within 2%: the 16px icon's path spans 10 (stroke 1.5); the stepper's 7 units of a 12 box shown at 14px; the checkbox's 7 at 12px (heavier strokes).
const GLYPH = { icon: 9.6, marker: (7 * 14 * 1.05) / 12, box: 7.35 }

type Cut = { def: MacroDef; preset: PresetId; scheme: Scheme; anchor: string; glyph?: number; from: number; options?: ContentOptions }
const CUTS: Cut[] = [
  { def: copyButton, preset: "ledger", scheme: "light", anchor: "check", glyph: GLYPH.icon, from: 0.31, options: { key: 0 } },
  { def: asyncStatus, preset: "folio", scheme: "dark", anchor: "check", glyph: GLYPH.icon, from: 0.41, options: { heading: 0, card: 0, label: 0 } },
  { def: stepper, preset: "poster", scheme: "light", anchor: "check", glyph: GLYPH.marker, from: 0.21 },
  { def: checklist, preset: "folio", scheme: "light", anchor: "box", glyph: GLYPH.box, from: 0.21 },
  { def: otp, preset: "ledger", scheme: "dark", anchor: "slot2", from: 0.8 },
  { def: copyButton, preset: "poster", scheme: "dark", anchor: "check", glyph: GLYPH.icon, from: 0.31, options: { key: 0 } },
  { def: asyncStatus, preset: "ledger", scheme: "light", anchor: "check", glyph: GLYPH.icon, from: 0.41, options: { heading: 0, card: 0, label: 0 } },
  { def: stepper, preset: "poster", scheme: "dark", anchor: "check", glyph: GLYPH.marker, from: 0.21 },
]

// The checklist's pointer dot rests on the box and would sit over the check; the other cuts keep theirs, away from it. The pointer is the one absolute
// pointer-events-none div at the content's origin that holds a rounded dot.
const NO_POINTER = "[&_div.pointer-events-none.top-0.left-0:has(>div.rounded-full)]:hidden"
// The stepper's ring leaves its marker at 0.41 (a fast tier after the click) and would slide across the finished disk in the cut's last frames. Until then it sits on
// the marker's own edge in the same colour, so dropping it at 0.4 changes no pixel.
const RING_LEAVES = 0.4

export function MontageShot({ t }: { t: number }) {
  // A frame's time can land a hair under a cut (0.2499999): nudge so it belongs to the cut it is the first frame of.
  const i = Math.min(CUTS.length - 1, Math.floor((t + 1e-6) / CUT))
  const { def, preset, scheme, anchor, glyph, from, options } = CUTS[i]
  const local = Math.max(0, t - i * CUT)
  const mt = macroTime(local, { from, rate: RATE.real })
  const a = def.content.anchors(mt, preset, options)[anchor]
  // The copy icon's check path sits a quarter px low in its 16px box; every other check is centred on its anchor.
  const focus = def === copyButton || def === asyncStatus ? { x: a.x, y: a.y + 0.25 } : a
  const zoom = glyph ? CHECK_PX / glyph : SLOT_PX / (a.h ?? 44)
  return (
    <Shot key={i} className={cn(def === checklist && NO_POINTER, def === stepper && mt >= RING_LEAVES && "[&_[data-film-ring]]:hidden")} preset={preset} scheme={scheme} t={mt} content={def.content} options={options} cam={{ zoom, focus, push: 1 + 0.05 * ease.out(progress(local, 0, CUT)) }}>
      {/* The checkbox's label begins past the frame's right edge and shows as a sliver of its first letter; the paper covers it. */}
      {def === checklist && <div className="absolute inset-y-0 right-0 bg-background" style={{ width: 300 }} />}
      <Caption>{def.name}</Caption>
    </Shot>
  )
}
