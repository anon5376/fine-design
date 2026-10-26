import { ease, lerp, progress, spring, type Ease, type SpringSpec } from "@/site/film/clock"
import type { Anchor } from "./macros/kit"
import { FRAME, type Pt, type ShotCam } from "./shot"

// Camera paths for Shot, as pure functions of the shot's time: no state, so a render can jump anywhere.
//   const cam = path(t, { zoom: 9, focus: a.caret }, [
//     { t: 1.0, dur: 0.45, ease: ease.inOut, to: { zoom: 2.2, focus: a.field } },     // a crisp pull-back
//     { t: 1.5, spring: springs.moderate, to: { zoom: 3, focus: a.eye } },             // a spring move, retargeted if another starts mid-way
//   ])
//   cam.focus = follow(t => anchorsAt(t).ring, t, 0.12)                                // or dolly along a moving anchor, a little behind it

export const FRAME_CENTRE: Pt = { x: FRAME.w / 2, y: FRAME.h / 2 }

const mix = (a: number | undefined, b: number | undefined, p: number, d: number) => lerp(a ?? d, b ?? d, p)

/** Blends two cams. The zoom blends in log space (equal ratios in equal time, the way a dolly reads); everything else linearly. A spring's overshoot (p > 1) extrapolates. */
export function mixCam(a: ShotCam, b: ShotCam, p: number): ShotCam {
  const at = (c: ShotCam) => c.at ?? FRAME_CENTRE
  return {
    zoom: Math.exp(lerp(Math.log(a.zoom), Math.log(b.zoom), p)),
    focus: { x: lerp(a.focus.x, b.focus.x, p), y: lerp(a.focus.y, b.focus.y, p) },
    at: { x: lerp(at(a).x, at(b).x, p), y: lerp(at(a).y, at(b).y, p) },
    rx: mix(a.rx, b.rx, p, 0),
    ry: mix(a.ry, b.ry, p, 0),
    rz: mix(a.rz, b.rz, p, 0),
    push: mix(a.push, b.push, p, 1),
    x: mix(a.x, b.x, p, 0),
    y: mix(a.y, b.y, p, 0),
    p: b.p ?? a.p,
  }
}

/**
 * One move of a path: from `t` the camera goes from wherever it is to `to`, on a spring or on an ease over `dur` seconds (default: ease.inOut over
 * 0.5 s). A move that starts while the one before is still going takes over from the current position, like a CSS transition retargeting.
 */
export type Move = { t: number; to: ShotCam; dur?: number; ease?: Ease; spring?: SpringSpec }

const curve = (m: Move, dt: number) => (m.spring ? spring(dt, m.spring) : (m.ease ?? ease.inOut)(progress(dt, 0, m.dur ?? 0.5)))

/** The camera at time t: `start` (a cam, or a function of time for one that tracks something, like `focus: follow(...)`), then each move in order of `t`. */
export function path(t: number, start: ShotCam | ((t: number) => ShotCam), moves: Move[]): ShotCam {
  const upTo = (time: number, n: number): ShotCam => {
    if (n === 0) return typeof start === "function" ? start(time) : start
    const m = moves[n - 1]
    if (time <= m.t) return upTo(time, n - 1)
    return mixCam(upTo(m.t, n - 1), m.to, curve(m, time - m.t))
  }
  return upTo(t, moves.length)
}

/**
 * `f` seen through a critically damped follower: the value lags f's path by about `lag` seconds and takes its corners softly, so a camera
 * dollying along a moving anchor (the OTP ring, the stepper's ring) trails it a little. Stateless: it averages f over the last 8 lags with
 * the follower's impulse response, and before 0 it holds f(0).
 */
export function follow(f: (t: number) => Pt, t: number, lag = 0.15): Pt {
  const step = lag / 10
  let sx = 0
  let sy = 0
  let sw = 0
  for (let u = step / 2; u < 8 * lag; u += step) {
    const w = u * Math.exp(-u / lag)
    const v = f(Math.max(0, t - u))
    sx += w * v.x
    sy += w * v.y
    sw += w
  }
  return { x: sx / sw, y: sy / sw }
}

/** A cam that frames `a` filling `fill` (0 to 1) of the frame's tighter side: the zoom for an anchor with an extent. Falls back to `fallback` for a bare point. */
export function fitZoom(a: Anchor, fill = 0.8, frame: { w: number; h: number } = FRAME, fallback = 8): number {
  return a.w && a.h ? Math.min((frame.w * fill) / a.w, (frame.h * fill) / a.h) : fallback
}

/** `p` of the way from a to b, for points. */
export const lerpPt = (a: Pt, b: Pt, p: number): Pt => ({ x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p) })

/** Where a content point lands on the frame under `cam`, ignoring tilt, roll and push (exact for a flat camera): the point to aim a ScaleWipe or a Title at. */
export function project(cam: ShotCam, p: Pt): Pt {
  const at = cam.at ?? FRAME_CENTRE
  return { x: at.x + (p.x - cam.focus.x) * cam.zoom + (cam.x ?? 0), y: at.y + (p.y - cam.focus.y) * cam.zoom + (cam.y ?? 0) }
}

/** An anchor (or any point) shifted by component px. */
export const nudge = (a: Pt, dx: number, dy = 0): Pt => ({ x: a.x + dx, y: a.y + dy })
