import type { ComponentType } from "react"
import type { SceneProps } from "./scene"
import { S1Ignition } from "./scenes/s1-ignition"
import { S2Command } from "./scenes/s2-command"
import { S3Wall } from "./scenes/s3-wall"
import { S4Macro } from "./scenes/s4-macro"
import { S5DayNight } from "./scenes/s5-day-night"
import { S6Agents } from "./scenes/s6-agents"
import { S7Out } from "./scenes/s7-out"

/**
 * The cut list. A scene is mounted (and visible) while start - pre <= time < end + post, and receives t = time - start,
 * so t is negative inside `pre`. Later scenes paint over earlier ones. `pre` lets a scene arrive before its cut (a
 * whip pan landing); a scene with a `pre` must not paint an opaque background it does not intend to show early.
 * Cuts sit on 120 BPM beats (multiples of 0.5s) unless the storyboard says otherwise.
 */
export type SceneDef = { id: string; name: string; start: number; end: number; pre: number; post: number; Component: ComponentType<SceneProps> }

export const SCENES: SceneDef[] = [
  { id: "s1", name: "Ignition", start: 0, end: 2, pre: 0, post: 0, Component: S1Ignition },
  { id: "s2", name: "One command", start: 2, end: 5, pre: 0, post: 0, Component: S2Command },
  { id: "s3", name: "The wall", start: 5, end: 9, pre: 0.4, post: 0, Component: S3Wall },
  { id: "s4", name: "Macro", start: 9, end: 13, pre: 0, post: 0, Component: S4Macro },
  { id: "s5", name: "Day / night", start: 13, end: 16, pre: 0, post: 0, Component: S5DayNight },
  { id: "s6", name: "For agents", start: 16, end: 19.5, pre: 0, post: 0, Component: S6Agents },
  { id: "s7", name: "Out", start: 19.5, end: 23, pre: 0, post: 0, Component: S7Out },
]
