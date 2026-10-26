import type { SceneDef } from "@/site/film/scene"
import { S1Version } from "./scenes/s1-version"
import { S2Looks } from "./scenes/s2-looks"
import { S3Macros } from "./scenes/s3-macros"
import { S4Forms } from "./scenes/s4-forms"
import { S5Fit } from "./scenes/s5-fit"
import { S6Install } from "./scenes/s6-install"
import { S7Out } from "./scenes/s7-out"

/** Length of fine 0.3 in seconds (1920x1080, 60fps, 120 BPM: every cut is a multiple of 0.5). */
export const DURATION = 24

/** The cut list of the second film, from the storyboard. Window rules are on SceneDef (site/film/scene.tsx). */
export const SCENES: SceneDef[] = [
  { id: "s1", name: "0.2 to 0.3", start: 0, end: 2.5, pre: 0, post: 0, Component: S1Version },
  { id: "s2", name: "Three looks", start: 2.5, end: 8, pre: 0, post: 0, Component: S2Looks },
  { id: "s3", name: "Animations, four macros", start: 8, end: 14, pre: 0, post: 0, Component: S3Macros },
  { id: "s4", name: "Forms explain themselves", start: 14, end: 16.5, pre: 0, post: 0, Component: S4Forms },
  { id: "s5", name: "Fits any width", start: 16.5, end: 19, pre: 0, post: 0, Component: S5Fit },
  { id: "s6", name: "Install a theme once", start: 19, end: 21.5, pre: 0, post: 0, Component: S6Install },
  { id: "s7", name: "Out", start: 21.5, end: 24, pre: 0, post: 0, Component: S7Out },
]
