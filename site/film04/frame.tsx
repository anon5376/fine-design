"use client"

import { createContext, useContext } from "react"
import type { Cam } from "@/site/film/s456/cam"
import { ease, progress } from "@/site/film/clock"
import { Caption } from "@/site/film03/s456/shared"
import type { PresetId, Scheme } from "@/site/film03/presets"
import type { MacroContent } from "./macros/kit"
import { Shot, type Pt } from "./shot"

/** True inside a wall tile, where the macro's own caption (at 96px from the frame's left edge) is outside the tile's window; the wall prints the name under the tile instead. */
export const InTile = createContext(false)

/**
 * The v1 framing of a macro, through Shot: the Content at `zoom` (v1's CenterBox zoom), its box centred on the frame (or `focus`, a component-px
 * point for a box that is not centred, like AutoHeight's), the v1 camera (`s` is the push, x and y a pan, rx ry rz the tilt) and the mono caption
 * bottom-left. The macros' `macro.Component` is this, so the old cut and the wall tiles still render as they did.
 */
export function MacroFrame({ content, preset, scheme, t, zoom, cam = {}, focus, caption }: { content: MacroContent; preset: PresetId; scheme: Scheme; t: number; zoom: number; cam?: Cam; focus?: Pt; caption: string }) {
  const inTile = useContext(InTile)
  const c = ease.outExpo(progress(t, 0.04, 0.4))
  return (
    <Shot
      preset={preset}
      scheme={scheme}
      t={t}
      content={content}
      cam={{ zoom, focus: focus ?? { x: content.size.w / 2, y: content.size.h / 2 }, push: cam.s, x: cam.x, y: cam.y, rx: cam.rx, ry: cam.ry, rz: cam.rz, p: cam.p }}
    >
      {!inTile && <Caption opacity={c}>{caption}</Caption>}
    </Shot>
  )
}
