import { clamp } from "@/site/film/clock"
import { MACRO_LENGTH } from "./macros/kit"

// Macro time from shot time. A macro is a function of its own seconds (0 to MACRO_LENGTH) with every tier slowed 2x so it reads at film scale.
// A shot decides how fast that clock runs against the film's, and when it starts, stops or holds.

/** Macro seconds per film second. `slowed` is how the macros were cut (v1); `real` runs them at fine's own tier speeds (80ms fast, 160ms moderate): the montage and the triptych. */
export const RATE = { slowed: 1, real: 2 } as const

/**
 * The macro's clock at shot time `t`: it starts at shot time `at` showing macro time `from`, runs at `rate` (macro s per shot s) and stops at
 * `hold` (default the macro's end; pass an earlier time to freeze on a pose). Never below 0.
 *   macroTime(t, { at: 0.15 })                           v1 speed, from its first frame at 0.15
 *   macroTime(t, { at: 11.5, from: 0.2, rate: RATE.real })   a check that draws in 0.25 s of film, starting 0.2 s into the macro
 *   macroTime(t, { hold: 0.6 })                          frozen at 0.6 once it gets there
 */
export function macroTime(t: number, { at = 0, from = 0, rate = RATE.slowed, hold = MACRO_LENGTH }: { at?: number; from?: number; rate?: number; hold?: number } = {}): number {
  return clamp(from + (t - at) * rate, 0, hold)
}
