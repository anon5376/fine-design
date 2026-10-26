"use client"

import type { ReactNode } from "react"
import { camStyle, type Cam } from "@/site/film/s456/cam"
import { ease, progress } from "@/site/film/clock"
import { PresetScene } from "../preset-scope"
import { Caption } from "../s456/shared"
import type { PresetId, Scheme } from "../presets"

// One macro of s3: the preset's background fills the frame (it is the colour of the shot), the subject sits in a natural-size box
// at the centre of the camera plane, and the camera scales it up. The caption stays outside the camera, fixed to the frame.

/**
 * A box centred in the camera plane. Children lay out in component pixels and CSS `zoom` makes them `zoom` times larger: the text
 * and edges are laid out and drawn at the final size. A transform scale would be rasterised small and blown up, which looks soft at
 * 4x to 10x, so the camera only does the small push and tilt on top. Lengths inside (translate, width) are zoomed with it.
 */
export function CenterBox({ w, h, zoom, children }: { w: number; h: number; zoom: number; children: ReactNode }) {
  return (
    <div className="absolute left-1/2 top-1/2" style={{ width: w, height: h, marginLeft: -w / 2, marginTop: -h / 2, zoom }}>
      {children}
    </div>
  )
}

/** What one component pixel measures in offsetWidth and friends under the nearest zoom (1 when they report unzoomed values). */
export function unitOf(probe: HTMLElement): number {
  return probe.offsetWidth / 100
}

export function MacroFrame({ preset, scheme, t, cam, caption, children }: { preset: PresetId; scheme: Scheme; t: number; cam: Cam; caption: string; children: ReactNode }) {
  const c = ease.outExpo(progress(t, 0.04, 0.4))
  return (
    <PresetScene preset={preset} scheme={scheme}>
      <div style={camStyle(cam)}>{children}</div>
      <Caption opacity={c}>{caption}</Caption>
    </PresetScene>
  )
}
