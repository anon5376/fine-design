"use client"

import type { ReactNode } from "react"
import { camTransform } from "@/site/film/s456/cam"
import { FILM } from "@/site/film/clock"
import { PresetScope } from "@/site/film03/preset-scope"
import type { PresetId, Scheme } from "@/site/film03/presets"
import { cn } from "@/lib/utils"
import type { Anchors, ContentOptions, MacroContent } from "./macros/kit"

// The film 0.4 v2 camera. A Shot is one macro, framed from any distance: the preset's paper fills the frame, the macro's Content is laid out in
// component px under a CSS `zoom` (so text and edges are laid out and drawn at the final size, crisp from zoom 1 to 40), and a transform on top
// does only the small things: tilt, roll, a push, a pan. Every 3D move pivots on `cam.at`, so the focus never slides.
//
// The mapping: the component-px point `cam.focus` lands on the frame point `cam.at` (default: the frame's centre), exactly, at any zoom.
//   screen = at + (content - focus) * zoom      (before rx, ry, rz, push, x and y, all of which pivot on or shift from `at`)
// The zoom sits on an element of its own with no offsets of its own: CSS zoom also scales an element's left, top and margins, so the
// position goes on the unzoomed parent. Chrome reports offsetWidth and friends unzoomed, which the macros' measuring relies on.

export type Pt = { x: number; y: number }

/** Where the camera is: a point of the content (component px), the frame point it sits on, and how it looks at it. Angles in degrees. */
export type ShotCam = {
  /** CSS zoom of the content, 1 to 40: how many frame px one component px takes. */
  zoom: number
  /** The component-px point (from the Content box's top-left) that lands on `at`. Pass an anchor, or an anchor plus an offset. */
  focus: Pt
  /** The frame point the focus lands on; the frame's centre when omitted. */
  at?: Pt
  rx?: number
  ry?: number
  rz?: number
  /** A transform scale about `at` on top of the zoom (1 = none). Keep it within 0.9 to 1.1 so the zoom stays the source of size and crispness. */
  push?: number
  /** A frame-px shift after the tilt, as v1's drift had (the focus leaves `at` by this much). */
  x?: number
  y?: number
  /** Perspective distance in px (default 2400; smaller exaggerates the tilt). */
  p?: number
}

export const FRAME = { w: FILM.width, h: FILM.height } as const

/**
 * `t` is the macro's local seconds (see time.ts to play one at tier speed, slowed or held). `frame` is the size of what the Shot fills when
 * that is not the 1920x1080 stage (a tile of the triptych or the wall); the Shot always fills its positioned parent. `children` paint over the
 * macro in frame px, clipped with it (a Title, a caption). `bg={false}` leaves the paper out, for a Shot laid over another. `debug` draws
 * every anchor (name, cross, extent) on the content, for aiming a camera. `options` are the macro's own per-shot choices (see ContentOptions).
 */
export function Shot({
  preset,
  scheme,
  t,
  content,
  cam,
  frame = FRAME,
  bg = true,
  debug = false,
  options,
  className,
  children,
}: {
  preset: PresetId
  scheme: Scheme
  t: number
  content: MacroContent
  cam: ShotCam
  frame?: { w: number; h: number }
  bg?: boolean
  debug?: boolean
  options?: ContentOptions
  className?: string
  children?: ReactNode
}) {
  const { Content, size } = content
  const { zoom, focus, push = 1, x = 0, y = 0, rx, ry, rz, p } = cam
  const at = cam.at ?? { x: frame.w / 2, y: frame.h / 2 }
  return (
    <PresetScope preset={preset} scheme={scheme} bg={bg} className={cn("absolute inset-0 overflow-hidden", className)}>
      <div
        className="absolute inset-0"
        style={{ transform: camTransform({ s: push, x, y, rx, ry, rz, p }), transformOrigin: `${at.x}px ${at.y}px` }}
      >
        <div className="absolute left-0 top-0" style={{ transform: `translate(${at.x - focus.x * zoom}px, ${at.y - focus.y * zoom}px)` }}>
          <div data-shot-content="" style={{ zoom, width: size.w, height: size.h }}>
            <Content t={t} preset={preset} scheme={scheme} zoom={zoom} options={options} />
            {debug && <AnchorMarks anchors={content.anchors(t, preset, options)} zoom={zoom} />}
          </div>
        </div>
      </div>
      {children}
    </PresetScope>
  )
}

/** The anchors as crosses and outlines at a constant 2px on the frame whatever the zoom; each carries its numbers in data attributes (the layout checks read them). */
function AnchorMarks({ anchors, zoom }: { anchors: Anchors; zoom: number }) {
  return (
    <>
      {Object.entries(anchors).map(([name, a]) => (
        <div
          key={name}
          data-anchor={name}
          data-ax={a.x}
          data-ay={a.y}
          data-aw={a.w}
          data-ah={a.h}
          className="pointer-events-none absolute left-0 top-0"
          style={{ transform: `translate(${a.x}px, ${a.y}px)` }}
        >
          <div style={{ zoom: 1 / zoom }}>
            {a.w && a.h ? <div className="absolute border-2 border-dashed" style={{ left: (-a.w / 2) * zoom, top: (-a.h / 2) * zoom, width: a.w * zoom, height: a.h * zoom, borderColor: "#ff2d9a" }} /> : null}
            <div className="absolute" style={{ left: -14, top: -1, width: 28, height: 2, background: "#ff2d9a" }} />
            <div className="absolute" style={{ left: -1, top: -14, width: 2, height: 28, background: "#ff2d9a" }} />
            <div className="absolute whitespace-nowrap font-mono" style={{ left: 8, top: 6, fontSize: 18, lineHeight: 1, color: "#ff2d9a", background: "#000a", padding: "2px 4px" }}>
              {name}
            </div>
          </div>
        </div>
      ))}
    </>
  )
}
