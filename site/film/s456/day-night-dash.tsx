"use client"

import { Moon, Sun } from "lucide-react"
import { DashboardShell } from "@/components/blocks/dashboard-shell"
import { IconButton } from "@/components/ui/icon-button"
import { spring, springs } from "../clock"
import { camStyle, type Cam } from "./cam"

// One copy of the real dashboard-shell block at 1920x1080, with a theme toggle laid over the header (the block has none).
// The block fills the whole frame (1280x720 logical at 1.42x) with no window chrome, and the backdrop is the block's own background,
// so under a camera tilt the plane has no visible edge: it reads as the app, not a screenshot in a box.
// No clicks are driven into the block: its Pagination indicator is a shared-layout animation (layoutId), and Motion
// measures layout in screen space but applies it in the camera's transformed space, so under any camera move it flies away.

// The block is laid out at 1280x720 (its 4-column desktop layout starts at 1280) and scaled 1.42x to 1818x1022, centred: 95% of the frame width, with just enough margin that the push and tilt never crop the sidebar or the header actions.
const LOGICAL = { w: 1280, h: 720 }
const SCALE = 1.42
const WIN = { x: (1920 - LOGICAL.w * SCALE) / 2, y: (1080 - LOGICAL.h * SCALE) / 2, w: LOGICAL.w * SCALE, h: LOGICAL.h * SCALE }
const TOGGLE_LOGICAL = { x: 1194, y: 28 } // header: 24px padding, 32px avatar, 12px gap, 36px button
/** Centre of the toggle in the 1920x1080 film plane (before the camera). */
export const TOGGLE = { x: WIN.x + TOGGLE_LOGICAL.x * SCALE, y: WIN.y + TOGGLE_LOGICAL.y * SCALE }
export const CAM_ORIGIN = { x: 960, y: 540 } // transform-origin of the camera

/** Where a point of the plane lands on screen under the camera (scale, rotateY, rotateX, perspective), matching camTransform. */
export function project(px: number, py: number, cam: Required<Pick<Cam, "s" | "rx" | "ry" | "p">> & Pick<Cam, "x" | "y">) {
  const rad = Math.PI / 180
  const dx = (px - CAM_ORIGIN.x) * cam.s
  const dy = (py - CAM_ORIGIN.y) * cam.s
  const x1 = dx * Math.cos(cam.ry * rad)
  const z1 = -dx * Math.sin(cam.ry * rad)
  const y2 = dy * Math.cos(cam.rx * rad) - z1 * Math.sin(cam.rx * rad)
  const z2 = dy * Math.sin(cam.rx * rad) + z1 * Math.cos(cam.rx * rad)
  const f = cam.p / (cam.p - z2)
  return { x: CAM_ORIGIN.x + (x1 + (cam.x ?? 0)) * f, y: CAM_ORIGIN.y + (y2 + (cam.y ?? 0)) * f }
}

export function DashCopy({ t, night, cam, presses }: { t: number; night: boolean; cam: Cam; presses: readonly number[] }) {
  // The toggle is pressed just before each wipe: it dips and springs back with overshoot.
  const at = presses.filter(p => t >= p).pop()
  const scale = at === undefined ? 1 : 0.84 + 0.16 * spring(t - at, springs.hero)
  const held = presses.some(p => t >= p - 0.02 && t < p + 0.08)
  return (
    <div className={(night ? "dark" : "light") + " absolute inset-0 bg-background text-foreground"}>
      <div style={camStyle(cam, `${CAM_ORIGIN.x}px ${CAM_ORIGIN.y}px`)}>
        <div className="absolute overflow-clip bg-background" style={{ left: WIN.x, top: WIN.y, width: WIN.w, height: WIN.h }}>
          <div className="relative origin-top-left [&_nav_.bg-primary]:opacity-100! [&_nav_.bg-primary]:transform-none!" style={{ width: LOGICAL.w, height: LOGICAL.h, transform: `scale(${SCALE})` }}>
            <DashboardShell />
            <IconButton
              label={night ? "Use light theme" : "Use dark theme"}
              tabIndex={-1}
              className={held ? "absolute [&>span:first-child]:[--btn-bg:var(--active)]" : "absolute"}
              style={{ left: TOGGLE_LOGICAL.x - 18, top: TOGGLE_LOGICAL.y - 18, transform: `scale(${scale})` }}
            >
              {night ? <Moon /> : <Sun />}
            </IconButton>
          </div>
        </div>
      </div>
    </div>
  )
}
