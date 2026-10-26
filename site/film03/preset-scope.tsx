import type { CSSProperties, ReactNode } from "react"
import { cn } from "@/lib/utils"
import type { PresetId, Scheme } from "./presets"

// Needs the scope CSS from preset-css.ts (the /film/v03/ page renders it). Presets and schemes can be nested, stacked
// (a crossfade is two scopes with an opacity) and placed side by side: each scope sets every token on its own element.
// Do not put a .dark or .light class inside one; the scheme is the prop.
// Base UI portals (Dialog, Popover, Select) mount on document.body, outside the stage and outside every scope: render popups inline.

/** A subtree in one preset and one scheme: its tokens, its sans face, its base text size and its text color (what the docs body sets at :root). `bg` also paints the scheme's background. */
export function PresetScope({
  preset,
  scheme,
  bg = false,
  className,
  style,
  children,
}: {
  preset: PresetId
  scheme: Scheme
  bg?: boolean
  className?: string
  style?: CSSProperties
  children?: ReactNode
}) {
  return (
    <div data-film-preset={preset} data-film-scheme={scheme} className={cn("font-sans text-sm text-foreground", bg && "bg-background", className)} style={style}>
      {children}
    </div>
  )
}

/**
 * The root of a v0.3 scene: fills the 1920x1080 stage, clips, and sets the preset and scheme (the PresetScope version of
 * site/film/scene.tsx's Scene). Pass `bg={false}` when the scene paints its own background or layers over the previous one.
 */
export function PresetScene({ preset, scheme, bg = true, className, children }: { preset: PresetId; scheme: Scheme; bg?: boolean; className?: string; children?: ReactNode }) {
  return (
    <PresetScope preset={preset} scheme={scheme} bg={bg} className={cn("absolute inset-0 overflow-hidden", className)}>
      {children}
    </PresetScope>
  )
}
