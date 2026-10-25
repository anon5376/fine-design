"use client"

import { useState, type ComponentProps } from "react"
import { Slider as SliderPrimitive } from "@base-ui/react/slider"
import { cn } from "@/lib/utils"

type SliderProps = ComponentProps<typeof SliderPrimitive.Root> & {
  /** Accessible name for the thumb(s). Required unless a visible label is linked by aria-labelledby. */
  "aria-label"?: string
  "aria-labelledby"?: string
}

/**
 * Thumb and range glide to the spot on moderate (spring.moderate in CSS) when the track is pressed,
 * so the jump reads as a move. Drag and keyboard steps are instant: a drag must track the pointer
 * exactly, and a held arrow key repeats faster than the fast tier, so a tween would trail the value.
 * The position is the information here, so it animates as inset-inline-start and width, not transform.
 * Reduced motion makes the track press a jump too.
 */
const glideThumb =
  "motion-safe:data-glide:transition-[background-color,inset-inline-start] motion-safe:data-glide:duration-(--duration-moderate) motion-safe:data-glide:ease-spring-moderate"
const glideRange =
  "motion-safe:data-glide:transition-[inset-inline-start,width] motion-safe:data-glide:duration-(--duration-moderate) motion-safe:data-glide:ease-spring-moderate"

function Slider({ className, value, defaultValue, onValueChange, "aria-label": label, "aria-labelledby": labelledBy, ...props }: SliderProps) {
  const current = value ?? defaultValue
  const thumbs = Array.isArray(current) ? current.length : 1
  // True from a track press until the glide ends or a drag or key press takes over.
  const [glide, setGlide] = useState(false)
  const settle = (e: { propertyName: string }) => {
    if (e.propertyName === "inset-inline-start" || e.propertyName === "width") setGlide(false)
  }
  return (
    <SliderPrimitive.Root
      value={value}
      defaultValue={defaultValue}
      onValueChange={(next, details) => {
        setGlide(details.reason === "track-press")
        // Base UI types onValueChange per value shape; ours forwards whichever the caller passed.
        ;(onValueChange as ((v: unknown, d: typeof details) => void) | undefined)?.(next, details)
      }}
      className={cn("w-full", className)}
      {...props}
    >
      <SliderPrimitive.Control className="flex h-5 w-full touch-none select-none items-center data-disabled:opacity-50">
        <SliderPrimitive.Track className="h-1 w-full rounded-full bg-secondary">
          <SliderPrimitive.Indicator data-glide={glide ? "" : undefined} onTransitionEnd={settle} className={cn("rounded-full bg-primary", glideRange)} />
          {Array.from({ length: thumbs }, (_, i) => (
            <SliderPrimitive.Thumb
              key={i}
              index={thumbs > 1 ? i : undefined}
              aria-label={label}
              aria-labelledby={labelledBy}
              data-glide={glide ? "" : undefined}
              onTransitionEnd={settle}
              className={cn(
                "size-4 rounded-full border-2 border-primary bg-surface outline-none transition-colors duration-(--duration-fast) hover:bg-muted focus-visible:focus-ring",
                glideThumb,
              )}
            />
          ))}
        </SliderPrimitive.Track>
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  )
}

export { Slider }
export type { SliderProps }
