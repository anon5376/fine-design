"use client"

import { ease, lerp, progress } from "@/site/film/clock"
import { fontStack } from "@/site/film/wordmark"
import { PresetScene } from "@/site/film03/preset-scope"
import type { PresetId, Scheme } from "@/site/film03/presets"
import type { Anchor } from "../macros/kit"
import { macro as bell } from "../macros/notification-bell"
import { macro as copyButton } from "../macros/copy-button"
import { macro as reaction } from "../macros/reaction-button"
import { macro as stepper } from "../macros/stepper"
import type { ContentOptions, MacroDef } from "../macros/kit"
import { Shot } from "../shot"
import { RATE, macroTime } from "../time"

// Shot 12, 19.0-21.0 (shot time 0-2), ink: Ledger, Folio and Poster in three tall columns with ink gutters. Every beat (0.5 s) the three cut together to the
// next macro and play its key moment at fine's own tier speed (RATE.real), each in its own preset, the scheme alternating per beat (light, dark, light, dark):
//   0.0  CopyButton, light: the pointer lands, the copy icon leaves and the check draws (the icon is 60% of a column's width)
//   0.5  Stepper, dark: both Continue clicks, the check draws and the ring hops Shipping, Payment, Review
//   1.0  NotificationBell, light: the first count, one swing, the second count rolling in mid-swing
//   1.5  ReactionButton, dark: the heart is at 13 and the star rolls 99 to 100
// Each subject is zoomed to the same size on the frame in all three columns (so the three looks compare like for like), the columns are staggered in height
// with the direction flipping each beat, and each column leans toward the centre and pushes in a little over its beat.

const COL = { w: 620, h: 1080 }
const GUTTER = 30
const PRESETS: PresetId[] = ["ledger", "folio", "poster"]
const NAMES: Record<PresetId, string> = { ledger: "Ledger", folio: "Folio", poster: "Poster" }
const BEAT = 0.5
const LEAN = 7

type Beat = { def: MacroDef; scheme: Scheme; from: number; names: string[]; width?: number; height?: number; stagger: number; options?: ContentOptions }

// `from` is the macro second a beat starts on; `names` are the anchors whose union is framed, at `width` or `height` px on the frame.
const BEATS: Beat[] = [
  // The copy icon's glyph is 14.3 of its 16px box, so a 400px box (zoom 25, 28 by the end of the beat) shows the glyph at 57% of a column's width, 62% at the end.
  { def: copyButton, scheme: "light", from: 0.1, names: ["icon"], width: 400, stagger: 150, options: { ptr: 2, key: 0 } },
  { def: stepper, scheme: "dark", from: 0.25, names: ["list"], height: 600, stagger: 120 },
  { def: bell, scheme: "light", from: 0.2, names: ["button", "badge"], width: 440, stagger: 150 },
  { def: reaction, scheme: "dark", from: 0.5, names: ["star"], width: 520, stagger: 170 },
]

/** The box that `names` span in the macro's laid-out state at its end (so the framing never wobbles as a star grows a digit). */
export function union(a: Record<string, Anchor>, names: string[]): Required<Anchor> {
  const rs = names.map(n => a[n])
  const x0 = Math.min(...rs.map(r => r.x - (r.w ?? 0) / 2))
  const x1 = Math.max(...rs.map(r => r.x + (r.w ?? 0) / 2))
  const y0 = Math.min(...rs.map(r => r.y - (r.h ?? 0) / 2))
  const y1 = Math.max(...rs.map(r => r.y + (r.h ?? 0) / 2))
  return { x: (x0 + x1) / 2, y: (y0 + y1) / 2, w: x1 - x0, h: y1 - y0 }
}

/** Where the last beat leaves the Ledger column's subject, for the wall to pick up: the frame point (in the 1920x1080 frame) and width of the star, and the column's lean. */
const LAST = BEATS.length - 1
const LAST_DIR = LAST % 2 === 0 ? 1 : -1
export const HANDOFF = {
  at: { x: COL.w / 2, y: COL.h / 2 - BEATS[LAST].stagger * LAST_DIR },
  width: BEATS[LAST].width! * 1.08,
  rx: -2 * LAST_DIR,
  ry: LEAN,
  rz: -1.2 * LAST_DIR,
}

export function Triptych({ t }: { t: number }) {
  const i = Math.min(BEATS.length - 1, Math.floor(t / BEAT))
  const local = t - i * BEAT
  const { def, scheme, from, names, width, height, stagger, options } = BEATS[i]
  const mt = macroTime(local, { from, rate: RATE.real })
  const dir = i % 2 === 0 ? 1 : -1
  return (
    <PresetScene preset="ledger" scheme="dark">
      {PRESETS.map((preset, c) => {
        const box = union(def.content.anchors(1.5, preset), names)
        const fit = width ? width / box.w : (height ?? 600) / box.h
        // A push over the beat on the zoom itself, so the subject stays crisp as it grows.
        const zoom = fit * lerp(1, 1.08, ease.out(progress(local, 0, BEAT)))
        const lift = (c - 1) * stagger * dir
        return (
          <div key={preset} className="absolute overflow-hidden" style={{ left: c * (COL.w + GUTTER), top: 0, width: COL.w, height: COL.h }}>
            <Shot
              key={`${i}-${preset}`}
              preset={preset}
              scheme={scheme}
              t={mt}
              content={def.content}
              options={options}
              frame={COL}
              cam={{ zoom, focus: box, at: { x: COL.w / 2, y: COL.h / 2 + lift }, ry: (1 - c) * LEAN, rx: -2 * dir, rz: (c - 1) * 1.2 * dir }}
            >
              <div className="absolute text-muted-foreground" style={{ left: 40, bottom: 44, fontFamily: fontStack("mono"), fontSize: 32, letterSpacing: "-0.01em" }}>
                {NAMES[preset]}
              </div>
            </Shot>
            <div className="pointer-events-none absolute inset-0" style={{ boxShadow: "inset 0 0 0 2px color-mix(in oklab, var(--foreground) 16%, transparent)" }} />
          </div>
        )
      })}
    </PresetScene>
  )
}
