"use client"

import { ease, lerp, progress } from "@/site/film/clock"

// A pointer dot for the macros. It lives in the camera plane but is counter-scaled by 1/k, so it is the same size on screen
// whatever the camera does. `press` is the time since the click (negative before it): the dot dips and a ring spreads out.
const SIZE = 34

export function Pointer({ x, y, k, press, opacity = 1 }: { x: number; y: number; k: number; press: number; opacity?: number }) {
  const down = press >= 0 && press < 0.14 ? ease.out(progress(press, 0, 0.07)) : 0
  const ring = progress(press, 0, 0.45)
  const up = press >= 0.14 ? ease.out(progress(press, 0.14, 0.12)) : 0
  const dip = press >= 0 ? (press < 0.14 ? down : 1 - up) : 0
  return (
    <div className="pointer-events-none absolute left-0 top-0" style={{ transform: `translate(${x}px, ${y}px) scale(${1 / k})`, opacity }}>
      <div
        className="absolute rounded-full border-foreground"
        style={{ width: SIZE, height: SIZE, left: -SIZE / 2, top: -SIZE / 2, borderWidth: 3, opacity: press >= 0 ? (1 - ease.out(ring)) * 0.7 : 0, transform: `scale(${lerp(0.9, 2.6, ease.out(ring))})` }}
      />
      <div
        className="absolute rounded-full border-background bg-foreground"
        style={{ width: SIZE, height: SIZE, left: -SIZE / 2, top: -SIZE / 2, borderWidth: 3, transform: `scale(${lerp(1, 0.78, dip)})` }}
      />
    </div>
  )
}
