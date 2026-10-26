"use client"

import type { SceneProps } from "@/site/film/scene"
import { ease, lerp, progress } from "@/site/film/clock"
import { follow, path } from "../camera"
import { macro as password } from "../macros/password-input"
import { macro as otp } from "../macros/otp-input"
import { Shot } from "../shot"
import { macroTime } from "../time"
import { Title, WhipPan } from "../transitions"

// A open, 0.0-4.0 (film 0.0-4.0): shots 1 and 2. Both shots take the group's time, so every beat below is a film time.
// Shot 1, PasswordInput, Poster dark. 0.0 black, resolving by 0.15 into zoom 8.6 pushing to 9.6 over the typing, the camera trailing the caret at 0.45 of
//   its speed (label, bars and strength word stay whole in frame). Chars 1-12 every 0.06 s from 0.2, 13-21 a frame apart to 1.01; Weak 0.32, Fair 0.50,
//   Good 0.68, Strong 0.86, each bar on the moderate spring. 1.0-1.45 the crisp pull-back to the whole field at zoom 4.8, tilted; Title "PasswordInput" rises
//   at 0.5 (fully risen by 0.9) in the top-right band, clear of the field's own label at the left and of the field below, so it never overprints either. The pointer glides in from 1.05 (the macro's `late` and
//   `glide` options) and clicks the eye at 1.5. 1.45-1.75 a spring push as the eye swaps. 1.75-2.0 the whip pan right.
// Shot 2, OtpInput, Ledger light. Zoom 15 settling to 13 while the whip lands, ry -9 swinging to -3 over the dolly. Digits 4 8 2 9 1 6 at 2.15, 2.35, ...
//   3.15; the camera follows the ring with a 0.12 s lag, the ring left of centre so the next slot is ahead of it. 3.35-3.8 the pull-back to all six at zoom 6
//   (fast out, so the wave reads on it); the success wave starts at 3.4 and runs to 3.96, and the ring fades with the last slot (`unfocus`) so the sixth green
//   shows. The block sits 110px lower than centre so a top band is free: Title "OtpInput" rises at 2.55 (risen by 2.95) top-left above the label. 3.8-4.0 a slow drift; the last frame is Ledger paper, light to light into the Stepper.

const BLACK = 0.15

function PasswordShot({ t }: { t: number }) {
  const options = { late: 0.35, glide: 1 }
  const hold = 1.9
  const mt = (time: number) => macroTime(time, { at: 0.15, hold })
  const a = (time: number) => password.content.anchors(mt(time), "poster")
  const cam = path(
    t,
    time => {
      const caret = follow(s => a(s).caret, time, 0.1)
      // A push from 8.6 to 9.6 over the typing, so nothing holds still; the label stays whole in frame (no sliver of it at the top edge).
      const push = ease.out(progress(time, 0, 1.0))
      return {
        zoom: lerp(8.6, 9.6, push),
        focus: { x: 92 + 0.45 * (caret.x - 22), y: 54 },
        at: { x: 1080, y: 470 },
        rx: 3,
        ry: lerp(-7, -4, progress(time, 0, 1.0)),
        rz: lerp(-1.5, -0.5, progress(time, 0, 1.0)),
      }
    },
    [
      { t: 1.0, dur: 0.45, ease: ease.inOut, to: { zoom: 4.8, focus: { x: 140, y: 70 }, at: { x: 1010, y: 660 }, rx: 4, ry: -9, rz: 0 } },
      { t: 1.45, spring: { visualDuration: 0.3, bounce: 0.1 }, to: { zoom: 5.4, focus: { x: 168, y: 62 }, at: { x: 1030, y: 650 }, rx: 3, ry: -6, rz: 0.6 } },
    ],
  )
  return (
    <>
      <Shot preset="poster" scheme="dark" t={mt(t)} content={password.content} cam={cam} options={options}>
        <Title text="PasswordInput" t={t} at={0.5} preset="poster" scheme="dark" size={124} x={1824} y={36} align="right" tone="muted" />
      </Shot>
      <div className="pointer-events-none absolute inset-0" style={{ background: "#000", opacity: 1 - ease.out(progress(t, 0, BLACK)) }} />
    </>
  )
}

function OtpShot({ t }: { t: number }) {
  const options = { every: 0.2, wait: 0.25, unfocus: 1 }
  const hold = 2.1
  // Macro time 0 is group time 1.95, so digit i lands at 2.15 + 0.2 i.
  const mt = (time: number) => macroTime(time, { at: 1.95, hold })
  const ring = (time: number) => otp.content.anchors(mt(time), "ledger", options).ring
  const cam = path(
    t,
    time => ({
      zoom: lerp(15, 13, ease.out(progress(time, 1.75, 0.7))),
      focus: follow(ring, time, 0.12),
      at: { x: 900, y: 750 },
      rx: 3,
      ry: lerp(-9, -3, ease.inOut(progress(time, 2.1, 1.1))),
      rz: lerp(1.5, 0, progress(time, 1.75, 1.4)),
    }),
    [{ t: 3.35, dur: 0.45, ease: ease.out, to: { zoom: 6, focus: { x: 170, y: 73 }, at: { x: 960, y: 690 }, rx: 2, ry: -2, rz: 0 } },
     { t: 3.8, dur: 0.2, ease: ease.linear, to: { zoom: 6.2, focus: { x: 170, y: 73 }, at: { x: 960, y: 690 }, rx: 2, ry: -1, rz: 0 } }],
  )
  return (
    <Shot preset="ledger" scheme="light" t={mt(t)} content={otp.content} cam={cam} options={options}>
      <Title text="OtpInput" t={t} at={2.55} preset="ledger" scheme="light" size={112} x={96} y={28} tone="muted" />
    </Shot>
  )
}

export function AOpen({ t }: SceneProps) {
  return <WhipPan from={<PasswordShot t={t} />} to={<OtpShot t={t} />} dir="right" t={t} at={1.75} dur={0.25} blur={90} />
}
