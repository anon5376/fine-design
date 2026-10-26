import type { SceneDef } from "./scene"
import { S1Ignition } from "./scenes/s1-ignition"
import { S2Command } from "./scenes/s2-command"
import { S3Wall } from "./scenes/s3-wall"
import { S4Macro } from "./scenes/s4-macro"
import { S5DayNight } from "./scenes/s5-day-night"
import { S6Agents } from "./scenes/s6-agents"
import { S7Out } from "./scenes/s7-out"

/** Length of the first film in seconds. The cut list below follows the window rules on SceneDef (scene.tsx). */
export const DURATION = 23

export const SCENES: SceneDef[] = [
  { id: "s1", name: "Ignition", start: 0, end: 2, pre: 0, post: 0, Component: S1Ignition },
  { id: "s2", name: "One command", start: 2, end: 5, pre: 0, post: 0, Component: S2Command },
  { id: "s3", name: "The wall", start: 5, end: 9, pre: 0.4, post: 0, Component: S3Wall },
  { id: "s4", name: "Macro", start: 9, end: 13, pre: 0, post: 0, Component: S4Macro },
  { id: "s5", name: "Day / night", start: 13, end: 16, pre: 0, post: 0, Component: S5DayNight },
  { id: "s6", name: "For agents", start: 16, end: 19.5, pre: 0, post: 0, Component: S6Agents },
  { id: "s7", name: "Out", start: 19.5, end: 23, pre: 0, post: 0, Component: S7Out },
]
