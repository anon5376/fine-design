"use client"

import type { CSSProperties, ReactNode } from "react"
import { DirectionalBlur } from "@/site/film/blur"
import { bezier, ease, lerp, progress, spring, type Ease, type SpringSpec } from "@/site/film/clock"
import { PresetScope } from "@/site/film03/preset-scope"
import type { PresetId, Scheme } from "@/site/film03/presets"
import { cn } from "@/lib/utils"
import { FRAME, type Pt } from "./shot"

// The film 0.4 v2 transitions and big type. Each is a component of the group's local time `t` that wraps whole shots (`from`, `to`: any node that fills
// the frame, normally a <Shot/>). Outside [at, at + dur] they render exactly one of the two shots, in the same place in the tree as inside the window,
// so a shot never remounts as the window opens or closes. The hard cut stays the default: just render the other shot.

/** A fast start and a long settle: a whip is mostly the middle of the move. */
const WHIP = bezier(0.72, 0, 0.18, 1)

/**
 * `from` and `to` pan across the frame: the camera swings `dir` ("right" = the view moves right, the next shot comes in from the right edge) from `at` over
 * `dur` seconds on a whip curve, with a directional blur along the move (`blur` px of standard deviation at the peak, mid-pan; 0 for a clean slide).
 * 0.4 to 0.5 s reads as a whip, longer as a pan. No blur outside the window.
 */
export function WhipPan({
  from,
  to,
  dir = "right",
  t,
  at,
  dur,
  blur = 70,
  frame = FRAME,
}: {
  from: ReactNode
  to: ReactNode
  dir?: "left" | "right" | "up" | "down"
  t: number
  at: number
  dur: number
  blur?: number
  frame?: { w: number; h: number }
}) {
  const p = WHIP(progress(t, at, dur))
  const horizontal = dir === "left" || dir === "right"
  const sign = dir === "right" || dir === "down" ? 1 : -1
  const span = horizontal ? frame.w : frame.h
  const move = (d: number): CSSProperties => ({ transform: horizontal ? `translateX(${d}px)` : `translateY(${d}px)` })
  const peak = Math.sin(Math.PI * p) ** 1.3 * blur
  return (
    <DirectionalBlur x={horizontal ? peak : 0} y={horizontal ? 0 : peak} className="absolute inset-0">
      {t < at + dur && (
        <div className="absolute inset-0" style={move(-sign * span * p)}>
          {from}
        </div>
      )}
      {t >= at && (
        <div className="absolute inset-0" style={move(sign * span * (1 - p))}>
          {to}
        </div>
      )}
    </DirectionalBlur>
  )
}

export type WipeShape = "circle" | "rect"

/**
 * A shape grows from `origin` (frame px) until it covers the frame, in `colour` (any CSS colour: `var(--primary)` inside a preset scope, or a literal).
 * `mode` "cover": it paints over `from`, and when it has covered the frame (at + dur) the film cuts to `to`, so `to` should open on `colour`. `mode`
 * "reveal": `to` is cut out by the growing shape over `from` (a window onto the next shot); `rim` px of `colour` edge it. The shape starts at `r0`
 * (a circle's radius, or half of a rect's shorter side) so it can begin as the thing it grows from (a badge): pass the badge's size on the frame.
 * "rect" rounds its corners by `radius` px and overshoots the frame by that much, so it covers fully. `ease` defaults to ease.inOut.
 */
export function ScaleWipe({
  from,
  to,
  shape = "circle",
  origin,
  colour,
  t,
  at,
  dur,
  mode = "cover",
  r0 = 0,
  radius = 40,
  rim = 0,
  easing = ease.inOut,
  frame = FRAME,
}: {
  from: ReactNode
  to: ReactNode
  shape?: WipeShape
  origin: Pt
  colour: string
  t: number
  at: number
  dur: number
  mode?: "cover" | "reveal"
  r0?: number
  radius?: number
  rim?: number
  easing?: Ease
  frame?: { w: number; h: number }
}) {
  const p = easing(progress(t, at, dur))
  const done = t >= at + dur
  // The farthest corner decides the circle's final radius; the rect's box runs from a r0-sized square at the origin to the frame plus its own corner radius.
  const far = Math.hypot(Math.max(origin.x, frame.w - origin.x), Math.max(origin.y, frame.h - origin.y)) + 2
  const r = lerp(r0, far, p)
  const box = {
    left: lerp(origin.x - r0, -radius, p),
    top: lerp(origin.y - r0, -radius, p),
    right: lerp(origin.x + r0, frame.w + radius, p),
    bottom: lerp(origin.y + r0, frame.h + radius, p),
  }
  const grown = (extra: number): CSSProperties =>
    shape === "circle"
      ? { left: origin.x - r - extra, top: origin.y - r - extra, width: 2 * (r + extra), height: 2 * (r + extra), borderRadius: "50%" }
      : { left: box.left - extra, top: box.top - extra, width: box.right - box.left + 2 * extra, height: box.bottom - box.top + 2 * extra, borderRadius: lerp(Math.min(radius, r0), radius, p) + extra }
  const cut: CSSProperties =
    shape === "circle"
      ? { clipPath: `circle(${r}px at ${origin.x}px ${origin.y}px)` }
      : { clipPath: `inset(${box.top}px ${frame.w - box.right}px ${frame.h - box.bottom}px ${box.left}px round ${lerp(Math.min(radius, r0), radius, p)}px)` }

  if (mode === "cover") {
    return (
      <div className="absolute inset-0 overflow-hidden">
        <div key={done ? "to" : "from"} className="absolute inset-0">
          {done ? to : from}
        </div>
        {!done && t >= at && <div className="absolute" style={{ ...grown(0), background: colour }} />}
      </div>
    )
  }
  return (
    <div className="absolute inset-0 overflow-hidden">
      {!done && (
        <div key="from" className="absolute inset-0">
          {from}
        </div>
      )}
      {t >= at && (
        <>
          {rim > 0 && !done && <div className="absolute" style={{ ...grown(rim), background: colour }} />}
          <div key="to" className="absolute inset-0" style={done ? undefined : cut}>
            {to}
          </div>
        </>
      )}
    </div>
  )
}

/** The rise of a Title: a quick spring with a hint of overshoot, a touch livelier than the moderate tier so big type lands. */
export const TITLE_RISE: SpringSpec = { visualDuration: 0.5, bounce: 0.18 }

/**
 * Big display type: a line in the preset's `font-display` that rises out of a mask (translateY from fully below the mask to 0, on `TITLE_RISE`) at `at`
 * seconds, and, when `until` is given, rises out the top of the mask on ease.exit over `leave` seconds. `x`, `y` are frame px of the line's box (its
 * top, with `align` choosing which of its left edge, centre or right edge `x` is); `size` is the font size in px (120 to 220 on a hero shot). `tone` is
 * foreground or muted-foreground. It sets its own preset and scheme scope, so it takes its face and colours from the shot it sits over. Put it in a
 * Shot's children or beside it; it is pointer-events-none and fills nothing but its own box.
 */
export function Title({
  text,
  t,
  at,
  preset,
  scheme,
  size = 160,
  x,
  y,
  align = "left",
  tone = "foreground",
  until,
  leave = 0.25,
  spec = TITLE_RISE,
}: {
  text: string
  t: number
  at: number
  preset: PresetId
  scheme: Scheme
  size?: number
  x: number
  y: number
  align?: "left" | "center" | "right"
  tone?: "foreground" | "muted"
  until?: number
  leave?: number
  spec?: SpringSpec
}) {
  const rise = spring(t - at, spec)
  const out = until === undefined ? 0 : ease.exit(progress(t, until, leave))
  if (t < at - 0.02 || out >= 1) return null
  // The mask is the line box plus a little room each way, so descenders and the spring's overshoot are not cut; the margins take the room back.
  const room = size * 0.12
  const shift = align === "left" ? "0" : align === "center" ? "-50%" : "-100%"
  return (
    <PresetScope preset={preset} scheme={scheme} className="pointer-events-none absolute left-0 top-0 h-0 w-0 text-base">
      <div className="absolute overflow-hidden whitespace-nowrap" style={{ left: x, top: y - room, padding: `${room}px 0`, transform: `translateX(${shift})` }}>
        <div
          className={cn("font-display font-strong", tone === "muted" ? "text-muted-foreground" : "text-foreground")}
          style={{ fontSize: size, lineHeight: 1, letterSpacing: "-0.03em", transform: `translateY(${lerp(110, 0, rise) - out * 110}%)` }}
        >
          {text}
        </div>
      </div>
    </PresetScope>
  )
}
