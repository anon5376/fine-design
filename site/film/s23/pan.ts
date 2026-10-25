import { bezier, clamp } from "../clock"

// The whip pan out of S2 and into S3, in film time. S2 (local t = film - 2) slides off to the left while the S3 board
// (local t = film - 5) slides in from the right on the same curve, so the two scenes behave as one continuous camera move.
export const WHIP = { start: 4.7, dur: 0.3, dist: 1920 } as const
const curve = bezier(0.8, 0, 0.2, 1)

/** Pan progress 0..1 at film time `film`. */
export const whipProgress = (film: number) => curve(clamp((film - WHIP.start) / WHIP.dur))

/** Screen speed in px/s, from the curve itself: drives the directional blur. */
export function whipSpeed(film: number) {
  const e = 1 / 240
  return (Math.abs(whipProgress(film + e) - whipProgress(film - e)) / (2 * e)) * WHIP.dist
}

/** Blur (std deviation, px) that peaks mid-pan. */
export const whipBlur = (film: number) => Math.min(70, whipSpeed(film) * 0.0052)
