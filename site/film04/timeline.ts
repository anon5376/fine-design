import type { SceneDef } from "@/site/film/scene"
import { Lab, LAB_DURATION } from "./lab"
import { AOpen } from "./shots/a-open"
import { BSetup } from "./shots/b-setup"
import { CWork } from "./shots/c-work"
import { DSocial } from "./shots/d-social"
import { EOut } from "./shots/e-out"

// NEXT_PUBLIC_FILM04_LAB=1 builds the camera lab instead of the film (lab.tsx); the film's own build never sets it.
const LAB = process.env.NEXT_PUBLIC_FILM04_LAB === "1"

/** Length of fine 0.4 in seconds (1920x1080, 60fps, 120 BPM: every cut is a multiple of 0.5, the montage's of 0.25). */
export const DURATION = LAB ? LAB_DURATION : 27

/**
 * The cut list, from the v2 storyboard: fourteen shots in five groups, one scene each (shots/). A group is one component of its own time that switches
 * between its shots and owns the transitions inside it; the cuts between groups are hard cuts on the beat.
 *   a-open   0.0-4.0   1 PasswordInput, 2 OtpInput (whip pan right at 1.75)
 *   b-setup  4.0-8.5   3 Stepper, 4 Checklist, 5 AutoHeight
 *   c-work   8.5-13.5  6 AsyncStatus, 7 CopyButton, 8 check montage
 *   d-social 13.5-19   9 ReactionButton, 10 NotificationBell (ScaleWipe from the badge at 16.2), 11 ConfirmButton
 *   e-out    19-27     12 triptych, 13 wall of ten, 14 out: 0.3 to 0.4
 */
export const SCENES: SceneDef[] = LAB
  ? [{ id: "lab", name: "Camera lab", start: 0, end: LAB_DURATION, pre: 0, post: 0, Component: Lab }]
  : [
      { id: "a-open", name: "Open: PasswordInput, OtpInput", start: 0, end: 4, pre: 0, post: 0, Component: AOpen },
      { id: "b-setup", name: "Setup: Stepper, Checklist, AutoHeight", start: 4, end: 8.5, pre: 0, post: 0, Component: BSetup },
      { id: "c-work", name: "Work: AsyncStatus, CopyButton, montage", start: 8.5, end: 13.5, pre: 0, post: 0, Component: CWork },
      { id: "d-social", name: "Social: ReactionButton, NotificationBell, ConfirmButton", start: 13.5, end: 19, pre: 0, post: 0, Component: DSocial },
      { id: "e-out", name: "Out: triptych, wall, 0.3 to 0.4", start: 19, end: 27, pre: 0, post: 0, Component: EOut },
    ]
