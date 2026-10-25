// Camera helpers shared by the S4-S6 scenes: one CSS transform string for a shallow perspective move.
import type { CSSProperties } from "react"

export type Cam = { s?: number; x?: number; y?: number; rx?: number; ry?: number; rz?: number; p?: number }

/** `perspective(p) translate rotate scale`, around the element's transform-origin. Angles in degrees. */
export function camTransform({ s = 1, x = 0, y = 0, rx = 0, ry = 0, rz = 0, p = 2200 }: Cam): string {
  return `perspective(${p}px) translate3d(${x}px, ${y}px, 0) rotateX(${rx}deg) rotateY(${ry}deg) rotate(${rz}deg) scale(${s})`
}

/** Fills the stage, carries the camera transform, and keeps text crisp under 3D (no layer promotion hints that blur). */
export function camStyle(cam: Cam, origin = "50% 50%"): CSSProperties {
  return { position: "absolute", inset: 0, transform: camTransform(cam), transformOrigin: origin }
}
