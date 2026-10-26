"use client"

import type { SceneProps } from "@/site/film/scene"
import { LockupOut } from "./e-out-lockup"
import { Triptych } from "./e-out-triptych"
import { Wall } from "./e-out-wall"

// E out, 19.0-27.0 (group time 0-8): shots 12 to 14, hard cuts between them (ink all through, so the cut at 21.0 is dark to dark and the one at 23.0 ink to ink).
//   12  19.0-21.0  triptych      e-out-triptych.tsx: three presets, four macros, cut together on the beat
//   13  21.0-23.0  wall of ten   e-out-wall.tsx: the camera pulls back from the ReactionButton tile to the 5 by 2 wall, the macros rippling
//   14  23.0-27.0  out           e-out-lockup.tsx: fine 0.3 rolls to 0.4, the underline steps through the presets, the URL types on
// Beats: 19.5 / 20.0 / 20.5 triptych cuts, 21.0 wall, 21.25 pull-back, 23.0 lockup, 23.5 roll, 24.0 / 24.5 / 25.0 underline steps, 25.5 hold.

export function EOut({ t }: SceneProps) {
  if (t < 2) return <Triptych key="triptych" t={t} />
  if (t < 4) return <Wall key="wall" t={t - 2} />
  return <LockupOut key="out" t={t - 4} />
}
