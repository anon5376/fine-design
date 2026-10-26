"use client"

// The film's clock and motion maths. One number drives everything: film time in seconds.
//   <Stage/> calls useFilmTime(duration) once; scenes get their local time as a prop, never a clock of their own.
// Time comes from performance.now() inside requestAnimationFrame, which scripts/render-film.mts replaces with a
// virtual clock, so the same code plays in real time for visitors and renders frame-exact to video.
import { createContext, useContext, useEffect, useState } from "react"
import { flushSync } from "react-dom"
import { spring as springGenerator } from "motion"

export const FILM = { width: 1920, height: 1080, bpm: 120, beat: 0.5 } as const

/** Seconds of beat n (120 BPM: every cut lands on a multiple of 0.5). */
export const beat = (n: number) => n * FILM.beat

export const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v))
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p
/** 0..1 position of t inside [start, start + dur], clamped. */
export const progress = (t: number, start: number, dur: number) => (dur <= 0 ? (t >= start ? 1 : 0) : clamp((t - start) / dur))
/** Maps p from [a, b] to [c, d], clamped. */
export const remap = (p: number, a: number, b: number, c = 0, d = 1) => lerp(c, d, clamp((p - a) / (b - a)))

// ---- easings: (0..1) => (0..1) ------------------------------------------------------------------------------

export type Ease = (p: number) => number

/** CSS cubic-bezier(x1, y1, x2, y2) as a function of progress. */
export function bezier(x1: number, y1: number, x2: number, y2: number): Ease {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by
  const sx = (s: number) => ((ax * s + bx) * s + cx) * s
  const sy = (s: number) => ((ay * s + by) * s + cy) * s
  const dx = (s: number) => (3 * ax * s + 2 * bx) * s + cx
  return p => {
    if (p <= 0) return 0
    if (p >= 1) return 1
    let s = p
    for (let i = 0; i < 8; i++) {
      const e = sx(s) - p
      if (Math.abs(e) < 1e-7) return sy(s)
      const d = dx(s)
      if (Math.abs(d) < 1e-6) break
      s -= e / d
    }
    let lo = 0, hi = 1
    s = p
    for (let i = 0; i < 40; i++) {
      const e = sx(s)
      if (Math.abs(e - p) < 1e-7) break
      if (e < p) lo = s
      else hi = s
      s = (lo + hi) / 2
    }
    return sy(s)
  }
}

export const ease = {
  /** fine's --ease-enter. */
  enter: bezier(0.23, 1, 0.32, 1),
  /** fine's --ease-exit. */
  exit: bezier(0.42, 0, 1, 1),
  inOut: bezier(0.65, 0, 0.35, 1),
  inOutSoft: bezier(0.45, 0, 0.2, 1),
  out: bezier(0.16, 1, 0.3, 1),
  outExpo: bezier(0.19, 1, 0.22, 1),
  in: bezier(0.55, 0, 1, 0.45),
  inStrong: bezier(0.7, 0, 0.95, 0.4),
  inCubic: (p: number) => p * p * p,
  inQuart: (p: number) => p * p * p * p,
  outCubic: (p: number) => 1 - (1 - p) ** 3,
  linear: (p: number) => p,
} as const

// ---- springs ------------------------------------------------------------------------------------------------

export type SpringSpec = { visualDuration: number; bounce: number }

/** fine's tiers (lib/motion.ts) plus `hero`, the same spring with the overshoot turned up for big type. */
export const springs = {
  moderate: { visualDuration: 0.16, bounce: 0 },
  slow: { visualDuration: 0.24, bounce: 0.12 },
  expressive: { visualDuration: 0.42, bounce: 0.28 },
  hero: { visualDuration: 0.55, bounce: 0.4 },
} as const satisfies Record<string, SpringSpec>

const generators = new Map<string, ReturnType<typeof springGenerator>>()

/**
 * Real spring from Motion's generator: 0 at t <= 0, 1 once settled, overshooting past 1 when bounce > 0.
 * t is seconds since the spring started. Pure and stateless, so scrubbing and re-rendering agree.
 *   const y = lerp(120, 0, spring(t - 0.45, springs.expressive))   // 120px below, springs up to 0
 */
export function spring(t: number, { visualDuration, bounce }: SpringSpec): number {
  if (t <= 0) return 0
  const key = `${visualDuration}/${bounce}`
  let g = generators.get(key)
  if (!g) {
    g = springGenerator({ keyframes: [0, 1], visualDuration, bounce })
    generators.set(key, g)
  }
  return g.next(t * 1000).value
}

// ---- the clock ----------------------------------------------------------------------------------------------

const round = (t: number) => Math.round(t * 1e6) / 1e6

const FilmTimeContext = createContext(0)
export const FilmTimeProvider = FilmTimeContext.Provider
/** Global film time (seconds) for deep components; scenes normally use the `t` prop instead. */
export const useFilmClock = () => useContext(FilmTimeContext)

/**
 * Film time in seconds (0 to `duration`, which each film sets), advanced from requestAnimationFrame and performance.now(). Query parameters:
 *   ?render=1  no looping (scripts/render-film.mts)    ?from=5.5  start playing at 5.5s    ?t=12.25  freeze on one time
 * Updates flush synchronously, so React has committed this time before the next frame callback runs.
 */
export function useFilmTime(duration: number): number {
  const [time, setTime] = useState(0)
  useEffect(() => {
    const q = new URLSearchParams(location.search)
    const frozen = q.get("t")
    if (frozen !== null) {
      setTime(Math.min(duration - 1e-6, Math.max(0, Number(frozen) || 0)))
      return
    }
    const loop = !q.has("render")
    let origin = performance.now() - (Number(q.get("from")) || 0) * 1000
    setTime(round((performance.now() - origin) / 1000))
    let raf = 0
    const tick = (now: number) => {
      let t = (now - origin) / 1000
      if (t >= duration) {
        if (loop) {
          origin += duration * 1000
          t -= duration
        } else t = duration - 1e-6
      }
      flushSync(() => setTime(round(Math.max(0, t))))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [duration])
  return time
}
