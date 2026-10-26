"use client"

import type { ReactNode } from "react"
import { FILM } from "@/site/film/clock"
import { PresetScope } from "@/site/film03/preset-scope"
import type { PresetId, Scheme } from "@/site/film03/presets"

/**
 * A w x h window onto a macro. The macro is laid out in a full 1920x1080 frame (that is what its CenterBox zoom, caption and pointer
 * assume) and scaled by `scale` about the frame's centre, then slid so the frame point (cx, cy) sits at the window's centre; the window
 * clips to w x h. Where the window reaches past the frame, the macro's own paper shows on, so the tile is one colour edge to edge.
 * Text is rasterised at the scaled size, not blown down from a bitmap.
 */
export function MacroTile({ w, h, scale, cx = FILM.width / 2, cy = FILM.height / 2, preset, scheme, children }: { w: number; h: number; scale: number; cx?: number; cy?: number; preset: PresetId; scheme: Scheme; children: ReactNode }) {
  const tx = -(cx - FILM.width / 2) * scale
  const ty = -(cy - FILM.height / 2) * scale
  return (
    <div className="relative overflow-hidden" style={{ width: w, height: h }}>
      <PresetScope preset={preset} scheme={scheme} bg className="absolute inset-0" />
      <div
        className="absolute left-1/2 top-1/2"
        style={{ width: FILM.width, height: FILM.height, marginLeft: -FILM.width / 2, marginTop: -FILM.height / 2, transform: `translate(${tx}px, ${ty}px) scale(${scale})`, transformOrigin: "50% 50%" }}
      >
        {children}
      </div>
    </div>
  )
}
