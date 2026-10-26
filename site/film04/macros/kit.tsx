// What every film 0.4 macro imports. One door for the frame, the camera plane box, the pointer and the caption (film 0.3's modules,
// re-exported, not copied), plus the contract types and the tier numbers at film speed.
import type { ComponentType, ReactNode } from "react"
import type { SpringSpec } from "@/site/film/clock"
import { ease, lerp, progress } from "@/site/film/clock"
import type { Cam } from "@/site/film/s456/cam"
import type { PresetId, Scheme } from "@/site/film03/presets"

export { unitOf } from "@/site/film03/s3/frame"
export { MacroFrame } from "../frame"
export { Pointer } from "@/site/film03/s3/pointer"
export { Caption } from "@/site/film03/s456/shared"
export type { PresetId, Scheme }

/** Seconds one macro plays. `t` runs 0..MACRO_LENGTH. */
export const MACRO_LENGTH = 1.5

/**
 * `t` is local seconds, 0 to MACRO_LENGTH. `preset` and `scheme` are for the wall (it replays the macro in another look); when
 * absent a macro uses its own. A macro is a pure function of these props: no film clock, no viewport, no timers.
 */
export type MacroProps = { t: number; preset?: PresetId; scheme?: Scheme }

/** A point of interest in component px, measured from the Content box's top-left. x, y is the centre; w, h (when there) the extent, for framing it. */
export type Anchor = { x: number; y: number; w?: number; h?: number }
export type Anchors = Record<string, Anchor>

/** Per-shot choices a macro may offer (OtpInput's `every`, ReactionButton's `first`); a macro ignores keys it does not know, and each defaults to what v1 played. */
export type ContentOptions = Record<string, number | string>

/** What Shot hands Content. `zoom` is the CSS zoom the box sits under, for counter-scaling the pointer (Pointer's `k`). `t` is local macro seconds, 0 to MACRO_LENGTH. */
export type ContentProps = { t: number; preset?: PresetId; scheme?: Scheme; zoom: number; options?: ContentOptions }

/**
 * A macro as framable content (the film 0.4 v2 contract): the component and its pointer laid out in component px inside a `size` box, no
 * frame, no camera, no caption. Shot (../shot.tsx) zooms it. `anchors(t, preset)` are the named points of interest at macro time t, in
 * the box's px, for the preset's layout (the macro's own preset when omitted); they move with t where the subject does.
 */
export type MacroContent = {
  size: { w: number; h: number }
  Content: ComponentType<ContentProps>
  anchors: (t: number, preset?: PresetId, options?: ContentOptions) => Anchors
  /** The macro's beats in its own seconds (a click, a state change, each typed character), so a shot can time its camera to them. */
  events: Record<string, number | number[]>
}

export type MacroDef = { slug: string; name: string; preset: PresetId; scheme: Scheme; Component: ComponentType<MacroProps>; content: MacroContent }

/** The Content box: `size` px, a positioning context (the pointer and the measured offsets are relative to it). The zoom is Shot's. */
export function ContentBox({ w, h, children }: { w: number; h: number; children: ReactNode }) {
  return (
    <div className="relative" style={{ width: w, height: h }}>
      {children}
    </div>
  )
}

/** fine's tiers slowed 2x so they read at film scale (the expressive bell swing 1.5x). Seconds. */
export const TIER = {
  fast: { enter: 0.16, exit: 0.12 },
  moderate: { enter: 0.32, exit: 0.24 },
  /** The 40ms stagger. */
  stagger: 0.08,
}

/** Springs for the tiers that enter on a spring, at the same slowed speed (compare lib/motion.ts: fast 0.08, moderate 0.16, expressive 0.42). */
export const SPRING = {
  fast: { visualDuration: 0.16, bounce: 0 },
  moderate: { visualDuration: 0.32, bounce: 0 },
  expressive: { visualDuration: 0.63, bounce: 0.28 },
} as const satisfies Record<string, SpringSpec>

/** A slight camera drift and push over the whole macro, so no frame is frozen. Pass `from` and `to` to aim it (any Cam field you omit stays at the default). */
export function drift(t: number, from: Cam = {}, to: Cam = {}): Cam {
  const a: Cam = { s: 0.95, ry: -4, rx: 2, ...from }
  const b: Cam = { s: 1.04, ry: 3, rx: -1.5, ...to }
  const p = ease.out(progress(t, 0, MACRO_LENGTH))
  const mix = (k: keyof Cam) => lerp(a[k] ?? 0, b[k] ?? 0, p)
  return { s: mix("s"), x: mix("x"), y: mix("y"), rx: mix("rx"), ry: mix("ry"), rz: mix("rz"), p: 2400 }
}
