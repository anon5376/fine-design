import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

/** What the Stage hands every scene. */
export type SceneProps = {
  /** Seconds since the scene's start (timeline.ts). Negative while a `pre` margin is showing; may exceed `duration` inside `post`. */
  t: number
  /** Scene length in seconds (end - start). */
  duration: number
}

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
