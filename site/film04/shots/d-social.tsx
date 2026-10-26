"use client"

import type { SceneProps } from "@/site/film/scene"
import { ease, lerp, progress } from "@/site/film/clock"
import { PresetScope } from "@/site/film03/preset-scope"
import { path, project } from "../camera"
import { macro as bell, swingAt } from "../macros/notification-bell"
import { macro as confirm } from "../macros/confirm-button"
import { macro as reaction } from "../macros/reaction-button"
import { Shot, type ShotCam } from "../shot"
import { ScaleWipe, Title } from "../transitions"

// D social, 13.5-19.0 (group time 0-5.5): shots 9 to 11.
// Shot 9, ReactionButton, 13.5-15.0, Ledger dark: opens on the star at the size of the montage's checks (416px, centre), the count beside it at 520px tall. The
//   star is pressed at 13.8 (option `first: "star"`): the icon fills, 99 rolls to 100 and the button gains a digit while the camera drifts from the icon to the
//   count. Pull back 14.3-14.9 (focus slides left) to both buttons; the pointer crosses and presses the heart at 14.55, 12 rolls to 13. The camera sits 200px low through
//   the close-up, so the button's top edge leaves a band for Title "ReactionButton", which rises at 13.7 (risen by 14.1).
// Shot 10, NotificationBell, 15.0-17.0, Poster dark: bell and badge at zoom 30, count 1 at 15.25 (swing, badge pop, a camera kick), count 2 at 15.7 (option
//   `second`). From 16.2 the camera dives into the badge (ease.in, 31 to 150) until its pink fills the frame at about 16.97; the digit dissolves into the pink first. Title "NotificationBell" sits inside the ring under the clapper (clear of the
//   ring and the bell), rises at 15.5 (risen by 15.9) and is gone by 16.2, before the dive carries the clapper into it.
// Shot 11, ConfirmButton, 17.0-19.0, Poster light: opens on that pink; a rect grows from the Delete button and reveals the scene (17.0-17.3). Click at 17.3, the question
//   sweeps in leftwards across the frame while the camera holds Confirm; pull back 17.8-18.25; Confirm pressed 18.1 (loading); collapse 18.5. Title "ConfirmButton" rises
//   at 17.55 (risen by 17.95) top-left, above the question row.
// Beats: 13.8 press, 14.3 pull-back, 14.55 heart, 15.25 count 1, 15.7 count 2, 16.2 dive, 17.0 cut, 17.3 open, 17.8 pull-back, 18.1 confirm, 18.5 collapse.

/** Macro seconds from shot seconds, through keys [shot s, macro s] joined by straight lines and held after the last: a macro's beat can move to the storyboard's second. */
function warp(t: number, keys: [number, number][]): number {
  if (t <= keys[0][0]) return keys[0][1]
  for (let i = 1; i < keys.length; i++) {
    const [t1, m1] = keys[i]
    if (t <= t1) {
      const [t0, m0] = keys[i - 1]
      return lerp(m0, m1, (t - t0) / (t1 - t0))
    }
  }
  return keys[keys.length - 1][1]
}

// ---- shot 9 ------------------------------------------------------------------------------------------------------------------------------------

/** A short push that settles: the camera feeling a press or a count land. */
const kick = (s: number) => (s < 0 ? 0 : 0.035 * Math.exp(-s / 0.14) * (1 - Math.exp(-s / 0.025)))

const REACTION = { first: "star" } as const
// The heart's press is macro 0.85; the storyboard has it at 14.55 (1.05 here), so the pointer's glide across is stretched.
const reactionClock = (t: number) => warp(t, [[0, 0], [0.55, 0.55], [1.05, 0.85], [1.5, 1.3]])
const starAt = (mt: number) => reaction.content.anchors(mt, "ledger", REACTION)

function ReactionShot({ t }: { t: number }) {
  const a = starAt(0)
  // The star icon sits at the frame's centre at the size of a montage check; the focus then drifts right to the count, which grows by a digit.
  const base = path(t, { zoom: 26, focus: a.starIcon, ry: -5, rx: 2, rz: -1.5 }, [
    { t: 0, dur: 0.8, ease: ease.inOutSoft, to: { zoom: 28.5, focus: { x: 140, y: 22 }, ry: 4, rx: 0, rz: 1 } },
    { t: 0.8, dur: 0.6, ease: ease.inOut, to: { zoom: 9.3, focus: { x: 95, y: 22 }, at: { x: 960, y: 740 }, ry: 3, rx: 0, rz: 0 } },
  ])
  // The camera settles 200px down in the first 0.3 s (the button's top edge leaves the frame's top band to the title) and comes back up with the pull-back.
  const cam = { ...base, y: 200 * ease.out(progress(t, 0, 0.3)) * (1 - ease.inOut(progress(t, 0.8, 0.6))), push: 1 + kick(t - 0.3) + kick(t - 1.05) / 2 }
  return (
    <Shot preset="ledger" scheme="dark" t={reactionClock(t)} content={reaction.content} cam={cam} options={REACTION}>
      <Title text="ReactionButton" t={t} at={0.2} preset="ledger" scheme="dark" size={112} x={96} y={44} tone="muted" />
    </Shot>
  )
}

// ---- shot 10 -----------------------------------------------------------------------------------------------------------------------------------

const DIVE_AT = 1.2
const DIVE = 0.75
const BELL_AT = { x: 800, y: 640 }
// The badge is 16 component px across; the dive ends with its radius past the frame's far corner (1102px from the centre); it is full by about 16.93 and the pink holds to the cut.
const DIVE_ZOOM = 160

function bellCam(t: number): ShotCam {
  const a = bell.content.anchors(0, "poster")
  const cam = path(t, { zoom: 31, focus: a.bell, at: BELL_AT, ry: -8, rx: 3, rz: -2 }, [
    { t: 0, dur: DIVE_AT, ease: ease.inOutSoft, to: { zoom: 35, focus: a.bell, at: BELL_AT, ry: -4, rx: 1, rz: 0 } },
    { t: DIVE_AT, dur: DIVE, ease: ease.in, to: { zoom: DIVE_ZOOM, focus: a.badge, at: { x: 960, y: 540 }, ry: 0, rx: 0, rz: 7 } },
  ])
  // The swing sways the frame a little with it; the two counts kick it.
  return { ...cam, rz: (cam.rz ?? 0) + 0.25 * swingAt(t), push: 1 + kick(t - 0.25) + kick(t - 0.7) }
}

function BellShot({ t }: { t: number }) {
  const options = { second: 0.7, dissolve: progress(t, 1.45, 0.4) }
  return (
    <Shot preset="poster" scheme="dark" t={Math.min(t, 1.5)} content={bell.content} cam={bellCam(t)} options={options}>
      <Title text="NotificationBell" t={t} at={0.5} preset="poster" scheme="dark" size={110} x={855} y={912} align="center" tone="muted" until={1.05} leave={0.15} />
    </Shot>
  )
}

// ---- shot 11 -----------------------------------------------------------------------------------------------------------------------------------

// Open at macro 0.3 (17.3), Confirm pressed 0.95 (18.1), the answer 1.25 (18.5): the question's sweep and the loading are stretched to the storyboard's seconds.
const confirmClock = (t: number) => warp(t, [[0, 0], [0.3, 0.3], [0.7, 0.55], [1.1, 0.95], [1.5, 1.25], [1.75, 1.5]])

function confirmCam(t: number): ShotCam {
  const a = confirm.content.anchors(0, "poster")
  return path(t, { zoom: 10, focus: a.trigger, at: { x: 1300, y: 540 }, ry: -5, rx: 2 }, [
    { t: 0, dur: 0.8, ease: ease.out, to: { zoom: 11.5, focus: { x: a.trigger.x - 10, y: a.trigger.y }, at: { x: 1300, y: 540 }, ry: -3, rx: 1 } },
    { t: 0.75, dur: 0.5, ease: ease.inOut, to: { zoom: 4.8, focus: { x: 200, y: 22 }, at: { x: 960, y: 700 }, ry: 0, rx: 0 } },
    { t: 1.25, dur: 0.75, ease: ease.inOutSoft, to: { zoom: 5.0, focus: { x: 200, y: 22 }, at: { x: 960, y: 700 }, ry: 3, rx: 0 } },
  ])
}

function ConfirmShot({ t }: { t: number }) {
  return (
    <Shot preset="poster" scheme="light" t={confirmClock(t)} content={confirm.content} cam={confirmCam(t)}>
      <Title text="ConfirmButton" t={t} at={0.55} preset="poster" scheme="light" size={200} x={96} y={64} tone="muted" />
    </Shot>
  )
}

export function DSocial({ t }: SceneProps) {
  if (t < 1.5) return <ReactionShot key="reaction" t={t} />
  if (t < 3.5) return <BellShot key="bell" t={t - 1.5} />
  // The dive ended on the badge's pink, which the next shot opens on: a rect grows from the Delete button and shows the scene through it.
  const origin = project(confirmCam(0), confirm.content.anchors(0, "poster").trigger)
  return (
    <PresetScope preset="poster" scheme="dark" className="absolute inset-0">
      <ScaleWipe
        from={<div className="absolute inset-0 bg-primary" />}
        to={<ConfirmShot t={t - 3.5} />}
        shape="rect"
        mode="reveal"
        origin={origin}
        colour="var(--primary)"
        radius={160}
        t={t - 3.5}
        at={0}
        dur={0.4}
        easing={ease.out}
      />
    </PresetScope>
  )
}
