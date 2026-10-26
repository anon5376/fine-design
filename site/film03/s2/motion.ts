// S2's clock-driven state: the switch thumb, the button press, the pointer and the retyped label. Every value is a pure function of the
// scene time t (seconds since 2.5), so a still and a video frame agree. Tiers are the real ones (AGENTS.md "Motion tiers") slowed 2x
// so they read at film scale: moderate 160ms -> 320ms, fast 80ms -> 160ms.
import { bezier, ease, lerp, progress, spring, type SpringSpec } from "@/site/film/clock"

/** Moderate tier: switch thumb travel and width (spring.moderate, no bounce). */
export const MODERATE: SpringSpec = { visualDuration: 0.32, bounce: 0 }
const FAST = 0.16
const MODERATE_TWEEN = 0.32
/** `transition-colors`' default curve (switch track). */
const TRACK_EASE = bezier(0.4, 0, 0.2, 1)

/** A change of target at time `at`; `f` maps seconds since `at` to 0..1. */
type Ev = { at: number; to: number; f: (dt: number) => number }
const sp = (spec: SpringSpec) => (dt: number) => spring(dt, spec)
const tw = (dur: number, e: (p: number) => number) => (dt: number) => e(progress(dt, 0, dur))

/** Value of a property that eases toward a new target at each event, starting from wherever it is when the next event lands (as a CSS transition does). */
function follow(init: number, evs: Ev[], t: number): number {
  let from = init
  let to = init
  let at = -1
  let f: Ev["f"] = () => 1
  for (const e of evs) {
    if (t < e.at) break
    from = lerp(from, to, f(e.at - at))
    to = e.to
    at = e.at
    f = e.f
  }
  return lerp(from, to, f(t - at))
}

// ---- the interaction, in scene time (abs 6.5-8.0 is 4.0-5.5) --------------------------------------------------------
export const IX = {
  pointerIn: 3.5,
  overSwitch: 3.95,
  down1: 4.15,
  up1: 4.29,
  down2: 4.6,
  up2: 4.74,
  leave: 4.78,
  overButton: 5.0,
  buttonDown: 5.06,
  buttonUp: 5.22,
}

export type Controls = {
  /** Switch thumb width in px and its travel in px; the track's share of --primary (1 on, 0 off). */
  thumbW: number
  thumbX: number
  trackOn: number
  /** Button: 0 rest, 1 hover, 2 pressed. */
  btn: number
}

export function controlsAt(t: number): Controls {
  // Width: 16 at rest, 18 under the pointer, 20 while pressed. Travel: 30 - width when on, 0 when off (data-checked:translate-x).
  const w = [
    { at: IX.overSwitch, to: 18 },
    { at: IX.down1, to: 20 },
    { at: IX.up1, to: 18 },
    { at: IX.down2, to: 20 },
    { at: IX.up2, to: 18 },
    { at: IX.leave, to: 16 },
  ]
  const x = [
    { at: IX.overSwitch, to: 12 },
    { at: IX.down1, to: 10 },
    { at: IX.up1, to: 0 },
    { at: IX.down2, to: 0 },
    { at: IX.up2, to: 12 },
    { at: IX.leave, to: 14 },
  ]
  const move = sp(MODERATE)
  const track: Ev[] = [
    { at: IX.up1, to: 0, f: tw(FAST, TRACK_EASE) },
    { at: IX.up2, to: 1, f: tw(FAST, TRACK_EASE) },
  ]
  // Button: hover and release ease on --ease-enter (moderate); the press is the fast tier.
  const btn: Ev[] = [
    { at: IX.overButton, to: 1, f: tw(MODERATE_TWEEN, ease.enter) },
    { at: IX.buttonDown, to: 2, f: tw(FAST, ease.enter) },
    { at: IX.buttonUp, to: 1, f: tw(MODERATE_TWEEN, ease.enter) },
  ]
  return {
    thumbW: follow(16, w.map(e => ({ ...e, f: move })), t),
    thumbX: follow(14, x.map(e => ({ ...e, f: move })), t),
    trackOn: follow(1, track, t),
    btn: follow(0, btn, t),
  }
}

/** Pointer in the column's own layout pixels. `sw` and `btn` are the centres of the switch and the primary button. */
export function pointerAt(t: number, sw: { x: number; y: number }, btn: { x: number; y: number }, w: number, h: number) {
  const start = { x: w * 0.9, y: h + 40 }
  const toSw = ease.out(progress(t, IX.pointerIn, IX.overSwitch + 0.1 - IX.pointerIn))
  const toBtn = ease.inOut(progress(t, IX.leave, IX.overButton + 0.04 - IX.leave))
  const a = { x: lerp(start.x, sw.x, toSw), y: lerp(start.y, sw.y, toSw) }
  const x = lerp(a.x, btn.x, toBtn)
  const y = lerp(a.y, btn.y, toBtn)
  const show = progress(t, IX.pointerIn, 0.12)
  // The dot shrinks while the mouse is down; a ring leaves from each click.
  const downs = [IX.down1, IX.down2, IX.buttonDown]
  const pressed = downs.reduce((m, d, i) => {
    const up = [IX.up1, IX.up2, IX.buttonUp][i]
    return Math.max(m, t >= d && t < up + 0.06 ? 1 : 0)
  }, 0)
  const ring = downs.map(d => progress(t, d, 0.38))
  return { x, y, show, pressed, ring }
}

// ---- the label --------------------------------------------------------------------------------------------------------
/** The mono label retypes: "theme-" stays, the name is deleted a letter at a time and the next one typed. Returns the text, whether the caret shows, and the preset whose mono face it is set in. */
export function labelAt(t: number): { text: string; caret: boolean; preset: "ledger" | "folio" | "poster" } {
  const names = ["ledger", "folio", "poster"] as const
  const TYPE = 0.05
  const DEL = 0.03
  const LEAD = "theme-"
  if (t < 1.0) {
    const n = Math.floor(Math.max(0, t - 0.1) / 0.035)
    const text = (LEAD + names[0]).slice(0, n)
    return { text, caret: t >= 0.1 && t < 1.0 - 0.45, preset: "ledger" }
  }
  const phase = t < 2.0 ? 1 : 2
  const start = phase === 1 ? 1.0 : 2.0
  const from = names[phase - 1]
  const to = names[phase]
  const dt = t - start
  const deleted = Math.min(from.length, Math.floor(dt / DEL))
  const typed = Math.max(0, Math.floor((dt - from.length * DEL - 0.04) / TYPE))
  const name = deleted < from.length ? from.slice(0, from.length - deleted) : to.slice(0, typed)
  const done = from.length * DEL + 0.04 + to.length * TYPE
  return { text: LEAD + name, caret: dt < done + 0.3, preset: dt >= from.length * DEL ? to : from }
}

