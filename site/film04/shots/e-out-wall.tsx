"use client"

import { bezier, ease, lerp, progress } from "@/site/film/clock"
import { camTransform } from "@/site/film/s456/cam"
import { fontStack } from "@/site/film/wordmark"
import { PresetScene } from "@/site/film03/preset-scope"
import { path, project } from "../camera"
import type { MacroDef } from "../macros/kit"
import { macro as asyncStatus } from "../macros/async-status"
import { macro as autoHeight } from "../macros/auto-height"
import { macro as checklist } from "../macros/checklist"
import { macro as confirm } from "../macros/confirm-button"
import { macro as copyButton } from "../macros/copy-button"
import { macro as bell } from "../macros/notification-bell"
import { macro as otp } from "../macros/otp-input"
import { macro as password } from "../macros/password-input"
import { macro as reaction } from "../macros/reaction-button"
import { macro as stepper } from "../macros/stepper"
import { MACRO_LENGTH } from "../macros/kit"
import { Shot, type Pt } from "../shot"
import { RATE, macroTime } from "../time"
import { HANDOFF, union } from "./e-out-triptych"

// Shot 13, 21.0-23.0 (shot time 0-2), ink: the wall of ten, 5 by 2, in the order of the user's day (the cut list's order), each macro live in its own preset and scheme.
//   0.0       the cut from the triptych lands on the ReactionButton tile, the wall's centre column and bottom row: its star at the frame point, width and lean the
//             Ledger column left it at, 13 and 100 as they ended, on the same ink paper. Nothing else of the wall is there yet.
//   0.0-1.2   the camera pulls back from there at once (zoom 3.5 to 1, the lean easing out; no still frame). The other nine tiles pop in around it, nearest first
//             (from the first frame, 0.035 s a ring, fading up from 90% of their size), showing their first frame; their macros start in reading order, one every 0.06 s from 0.1.
//             The wall plays 1.25x the slowed cut so the last tile ends with the shot. The label "10 new components" fades in as the camera lands.
//   1.2-2.0   a slow push on the wall (zoom 1 to 1.04, accelerating into the cut).
// Every tile is a Shot of its own (CSS zoom at its final on-frame size, so it is crisp at every point of the pull-back), fitted to its subject: the union of the
// anchors that make the subject, with 4% of the tile's width around it, not the macro's whole content box and not a crop of a 1920 frame.

const COLS = 5
const TILE = { w: 340, h: 330 }
const GAP = 24
const X0 = (1920 - (COLS * TILE.w + (COLS - 1) * GAP)) / 2
const Y0 = 214
const RIPPLE = { at: 0.1, every: 0.06, rate: 1.25 }
const FILL = 0.92
// Tiles come into view from the reaction tile outwards (by distance on the grid), so the pull-back never has an empty side; their macros start in reading order.
const ARRIVE = { at: 0, per: 0.035 }
const ring = (i: number) => Math.hypot((i % COLS) - 2, Math.floor(i / COLS) - 1)
const CENTRE: Pt = { x: 960, y: 540 }

const ORDER: MacroDef[] = [password, otp, stepper, checklist, autoHeight, asyncStatus, copyButton, reaction, bell, confirm]
// The anchors whose union is each macro's subject.
const SUBJECT: Record<string, string[]> = {
  "password-input": ["label", "field", "meter", "strength", "hint"],
  "otp-input": ["label", "row"],
  stepper: ["list", "continue"],
  checklist: ["list"],
  "auto-height": ["card"],
  "async-status": ["card"],
  "copy-button": ["snippet"],
  "reaction-button": ["heart", "star"],
  "notification-bell": ["card"],
  "confirm-button": ["row"],
}

type Tile = { def: MacroDef; x: number; y: number; subject: ReturnType<typeof union>; fit: number }

/** Where each tile sits on the plane (frame px at zoom 1) and how its subject fits it. The subject is the union over the macro's start and end, so a card that grows is framed open. */
const TILES: Tile[] = ORDER.map((def, i) => {
  const a0 = def.content.anchors(0, def.preset)
  const a1 = def.content.anchors(MACRO_LENGTH, def.preset)
  const names = SUBJECT[def.slug]
  const u0 = union(a0, names)
  const u1 = union(a1, names)
  const x0 = Math.min(u0.x - u0.w / 2, u1.x - u1.w / 2)
  const x1 = Math.max(u0.x + u0.w / 2, u1.x + u1.w / 2)
  const y0 = Math.min(u0.y - u0.h / 2, u1.y - u1.h / 2)
  const y1 = Math.max(u0.y + u0.h / 2, u1.y + u1.h / 2)
  const subject = { x: (x0 + x1) / 2, y: (y0 + y1) / 2, w: x1 - x0, h: y1 - y0 }
  const fit = Math.min((TILE.w * FILL) / subject.w, (TILE.h * FILL) / subject.h)
  return { def, x: X0 + (i % COLS) * (TILE.w + GAP), y: Y0 + Math.floor(i / COLS) * (TILE.h + GAP), subject, fit }
})

const STAR = TILES.findIndex(tile => tile.def === reaction)

/** A tile's component-px point on the plane. */
const onPlane = (tile: Tile, p: Pt): Pt => ({ x: tile.x + TILE.w / 2 + (p.x - tile.subject.x) * tile.fit, y: tile.y + TILE.h / 2 + (p.y - tile.subject.y) * tile.fit })

// The pull-back starts on the reaction tile exactly where the triptych's last beat leaves the Ledger column: the star at the same frame point, the same width,
// the same lean, 13 and 100 as they ended, on the same ink paper.
const STAR_BOX = union(reaction.content.anchors(MACRO_LENGTH, reaction.preset), ["star"])
const START = { zoom: HANDOFF.width / (STAR_BOX.w * TILES[STAR].fit), focus: onPlane(TILES[STAR], STAR_BOX), at: HANDOFF.at, rx: HANDOFF.rx, ry: HANDOFF.ry, rz: HANDOFF.rz }
const PULL = bezier(0.2, 0, 0.1, 1)

function wallCam(t: number) {
  return path(t, START, [
    { t: 0, dur: 1.2, ease: PULL, to: { zoom: 1, focus: CENTRE, at: CENTRE, rx: 0, ry: 0, rz: 0 } },
    { t: 1.2, dur: 0.8, ease: ease.in, to: { zoom: 1.04, focus: CENTRE, at: CENTRE } },
  ])
}

export function Wall({ t }: { t: number }) {
  const cam = wallCam(t)
  const label = ease.out(progress(t, 1.0, 0.3))
  // The label is part of the wall: it sits where the plane puts it, so the push carries it with the tiles.
  const labelAt = project(cam, { x: X0, y: 84 })
  return (
    <PresetScene preset="ledger" scheme="dark">
      <div className="absolute inset-0" style={{ transform: camTransform({ rx: cam.rx, ry: cam.ry, rz: cam.rz }), transformOrigin: `${cam.at?.x}px ${cam.at?.y}px` }}>
        {TILES.map((tile, i) => {
          const { def, fit, subject } = tile
          // The tile's rect on the frame: the plane under the camera, flat (the tilt is the wrapper's).
          const p = project(cam, { x: tile.x, y: tile.y })
          // A tile arrives as its macro starts (it fades up from 92% of its size); the reaction tile is the shot's first frame and stays as the triptych left it.
          const lt = t - RIPPLE.at - i * RIPPLE.every
          const arrive = i === STAR ? 1 : progress(t - ARRIVE.at - ARRIVE.per * ring(i), 0, 0.05)
          if (arrive <= 0) return null
          const grow = lerp(0.9, 1, i === STAR ? 1 : ease.out(progress(t - ARRIVE.at - ARRIVE.per * ring(i), 0, 0.3)))
          const w = TILE.w * cam.zoom * grow
          const h = TILE.h * cam.zoom * grow
          const x = p.x + (TILE.w * cam.zoom - w) / 2
          const y = p.y + (TILE.h * cam.zoom - h) / 2
          if (x > 1920 + 60 || y > 1080 + 60 || x + w < -60 || y + h < -60) return null
          const mt = i === STAR ? MACRO_LENGTH : macroTime(lt, { rate: RATE.slowed * RIPPLE.rate })
          return (
            <div
              key={def.slug}
              className="absolute overflow-hidden"
              style={{ left: x, top: y, width: w, height: h, opacity: arrive, borderRadius: 14 * cam.zoom * grow, boxShadow: "0 0 0 2px color-mix(in oklab, var(--foreground) 24%, transparent)" }}
            >
              <Shot
                preset={def.preset}
                scheme={def.scheme}
                t={mt}
                content={def.content}
                frame={{ w, h }}
                cam={{ zoom: fit * cam.zoom * grow, focus: subject }}
              />
            </div>
          )
        })}
      </div>
      <div className="absolute whitespace-nowrap text-muted-foreground" style={{ left: labelAt.x, top: labelAt.y + lerp(16, 0, label), fontFamily: fontStack("mono"), fontSize: 44 * cam.zoom, letterSpacing: "-0.01em", opacity: label }}>
        10 new components
      </div>
    </PresetScene>
  )
}
