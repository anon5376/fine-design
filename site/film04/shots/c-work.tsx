"use client"

import type { SceneProps } from "@/site/film/scene"
import { ease, progress } from "@/site/film/clock"
import { path } from "../camera"
import { macro as asyncStatus } from "../macros/async-status"
import { macro as copyButton } from "../macros/copy-button"
import { Shot } from "../shot"
import { macroTime } from "../time"
import { Title } from "../transitions"
import { MontageShot } from "./c-work-montage"

// C work, 8.5-13.5 (group time 0-5): shots 6 to 8, each light to light or dark to dark across the hard cuts (5 AutoHeight Ledger light in, 9 ReactionButton Ledger dark out).
// Shot 6, AsyncStatus, 8.5-10.0, Folio light: the status alone at billboard scale (the label's font about 350px, the line 1450px wide), the spinner turning. A slow dolly and tilt drift;
//   Saving to Saved at 8.95 with a small push as the answer lands; from 9.55 the camera dives into the check until it sits at the frame's centre at the copy icon's
//   size, so the hard cut into shot 7 is a match cut. The Title "AsyncStatus" rises at 8.6 and leaves as the dive starts.
// Shot 7, CopyButton, 10.0-11.5, Ledger light: the copy icon at 500px, the pointer swooping in; click at 10.3, the check draws; pull back 10.8-11.4 to the key beside it.
//   The icon trucks right by 10.3 so the left 700px are free: Title "CopyButton" rises at 10.2 (risen by 10.6); the key's text is held back until the pull-back.
// Shot 8, check montage, 11.5-13.5: eight cuts of 0.25 s (c-work-montage.tsx).
// Beats: 8.95 Saved, 9.55 dive, 10.3 click, 10.8 pull-back, 11.5 first cut then every 0.25.

/** The icon-sized box (16px) of the check and the copy icon, at the zoom where it measures 500px on the frame; shot 6 ends on it and shot 7 opens on it. */
const ICON_ZOOM = 31

function AsyncShot({ t }: { t: number }) {
  const a = asyncStatus.content.anchors(1.2, "folio")
  // The line's centre: from the spinner's left edge (it is 16px) to the right end of "Saved".
  const line = { x: (a.spinner.x - 8 + a.label.x + (a.label.w ?? 0) / 2) / 2, y: a.spinner.y }
  // It opens inside the spinner and pulls out to the line as the word arrives, so the first half second is already a move.
  const cam = path(t, { zoom: 33, focus: { x: line.x - 9, y: line.y }, ry: -12, rx: 4 }, [
    { t: 0, dur: 0.42, ease: ease.out, to: { zoom: 21, focus: line, ry: -8, rx: 2 } },
    { t: 0.45, spring: { visualDuration: 0.3, bounce: 0.1 }, to: { zoom: 22.5, focus: line, ry: 4, rx: -2 } },
    { t: 0.8, dur: 0.25, ease: ease.out, to: { zoom: 24, focus: line, ry: 8, rx: -2.5 } },
    { t: 1.05, dur: 0.43, ease: ease.inOut, to: { zoom: ICON_ZOOM, focus: { x: a.spinner.x, y: a.spinner.y + 0.25 }, ry: -4, rx: 0 } },
  ])
  return (
    <Shot preset="folio" scheme="light" t={macroTime(t)} content={asyncStatus.content} cam={cam} options={{ heading: 0, card: 0, label: 1 - ease.inOut(progress(t, 1.05, 0.3)) }}>
      <Title text="AsyncStatus" t={t} at={0.1} until={1.05} leave={0.2} preset="folio" scheme="light" size={96} x={96} y={64} tone="muted" />
    </Shot>
  )
}

function CopyShot({ t }: { t: number }) {
  const a = copyButton.content.anchors(0, "ledger")
  const icon = { x: a.icon.x, y: a.icon.y + 0.25 }
  // Opens where shot 6 ended, then trucks the icon to the right of the frame as the pointer approaches: the button's hover fill is as wide as 1200px, so this leaves
  // the left 700px (and the key's last letters, held back until the pull-back) as the title's column. A kick in on the click so the check lands with the camera.
  const SIDE = { x: 1400, y: 540 }
  const cam = path(t, { zoom: ICON_ZOOM, focus: icon, ry: -4 }, [
    { t: 0, dur: 0.3, ease: ease.out, to: { zoom: 34, focus: icon, at: SIDE, ry: -1, rz: -1.5 } },
    { t: 0.3, spring: { visualDuration: 0.25, bounce: 0.2 }, to: { zoom: 37, focus: icon, at: SIDE, ry: 2, rz: 0 } },
    { t: 0.8, dur: 0.6, ease: ease.inOut, to: { zoom: 7.5, focus: a.snippet, at: { x: 960, y: 700 }, ry: -2, rx: 1 } },
  ])
  return (
    <Shot preset="ledger" scheme="light" t={macroTime(t, { from: 0.05 })} content={copyButton.content} cam={cam} options={{ ptr: 2.5, key: progress(t, 0.95, 0.3) }}>
      <Title text="CopyButton" t={t} at={0.2} preset="ledger" scheme="light" size={104} x={48} y={72} tone="muted" />
    </Shot>
  )
}

export function CWork({ t }: SceneProps) {
  if (t < 1.5) return <AsyncShot key="async" t={t} />
  if (t < 3) return <CopyShot key="copy" t={t - 1.5} />
  return <MontageShot key="montage" t={t - 3} />
}
