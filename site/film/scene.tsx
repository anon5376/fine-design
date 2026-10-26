import type { ComponentType, ReactNode } from "react"
import { cn } from "@/lib/utils"

/** What the Stage hands every scene. */
export type SceneProps = {
  /** Seconds since the scene's start (timeline.ts). Negative while a `pre` margin is showing; may exceed `duration` inside `post`. */
  t: number
  /** Scene length in seconds (end - start). */
  duration: number
}

/**
 * One entry of a film's cut list. A scene is mounted (and visible) while start - pre <= time < end + post, and receives
 * t = time - start, so t is negative inside `pre`. Later scenes paint over earlier ones. `pre` lets a scene arrive before
 * its cut (a whip pan landing); a scene with a `pre` must not paint an opaque background it does not intend to show early.
 * Cuts sit on 120 BPM beats (multiples of 0.5s) unless the storyboard says otherwise.
 */
export type SceneDef = { id: string; name: string; start: number; end: number; pre: number; post: number; Component: ComponentType<SceneProps> }

/**
 * The root of every scene: fills the 1920x1080 stage, clips, and sets the token scheme. fine's tokens follow the
 * nearest .dark/.light class, so everything inside (components, bg-background, text-foreground) is themed.
 * Pass `bg={false}` when the scene paints its own background (or layers over the previous scene).
 */
export function Scene({ theme, bg = true, className, children }: { theme: "dark" | "light"; bg?: boolean; className?: string; children?: ReactNode }) {
  return (
    <div className={cn(theme, "absolute inset-0 overflow-hidden text-foreground", bg && "bg-background", className)}>
      {children}
    </div>
  )
}
