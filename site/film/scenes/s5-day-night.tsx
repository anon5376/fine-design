"use client"

import { Scene, type SceneProps } from "../scene"
import { bezier, ease, lerp, progress } from "../clock"
import { DashCopy, project, TOGGLE } from "../s456/day-night-dash"

// S5 Day / night (13.0-16.0). The real dashboard-shell block fills the frame, and it starts DARK so S4's ink carries straight in.
// The toggle is pressed at 13.32 and at 13.4 a circle opens from it (0.8s) over an identical LIGHT copy; the light version holds,
// then the toggle is pressed again at 14.92 and the same circle collapses back onto it by 15.8, leaving dark for S6's ink.
// Both copies sit inside the same camera (slow push, a gentle tilt that sweeps across), so the circle edge is the only seam.
const OPEN = { at: 0.4, dur: 0.8 }
const CLOSE = { at: 2.0, dur: 0.8 }
const PRESSES = [0.32, 1.92] as const
const wipe = bezier(0.7, 0, 0.16, 1)

export function S5DayNight({ t, duration }: SceneProps) {
  const p = ease.inOutSoft(progress(t, 0, duration))
  const cam = {
    s: lerp(1.0, 1.06, p),
    y: 14,
    rx: lerp(2.5, -1.5, p),
    ry: lerp(-3.5, 3.5, p),
    p: 2600,
  }
  const origin = project(TOGGLE.x, TOGGLE.y, cam)
  // far enough to cover the bottom-left corner from wherever the toggle sits
  const far = Math.hypot(origin.x, 1080 - origin.y) + 40
  const open = wipe(progress(t, OPEN.at, OPEN.dur))
  const close = wipe(progress(t, CLOSE.at, CLOSE.dur))
  const r = far * open * (1 - close)
  return (
    <Scene theme="dark">
      <DashCopy t={t} night cam={cam} presses={PRESSES} />
      {/* mounted from the start, so its pagination is already where the dark copy's is when the circle reaches it */}
      <div className="absolute inset-0" style={{ clipPath: `circle(${r.toFixed(2)}px at ${origin.x.toFixed(2)}px ${origin.y.toFixed(2)}px)`, visibility: r > 0.01 ? "visible" : "hidden" }}>
        <DashCopy t={t} night={false} cam={cam} presses={PRESSES} />
      </div>
    </Scene>
  )
}
