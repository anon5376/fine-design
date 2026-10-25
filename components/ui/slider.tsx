"use client"

import type { ComponentProps } from "react"
import { Slider as SliderPrimitive } from "@base-ui/react/slider"
import { cn } from "@/lib/utils"

type SliderProps = ComponentProps<typeof SliderPrimitive.Root> & {
  /** Accessible name for the thumb(s). Required unless a visible label is linked by aria-labelledby. */
  "aria-label"?: string
  "aria-labelledby"?: string
}

/** One thumb for a number value, two for a [min, max] range. Static: the thumb follows the pointer. */
function Slider({ className, value, defaultValue, "aria-label": label, "aria-labelledby": labelledBy, ...props }: SliderProps) {
  const current = value ?? defaultValue
  const thumbs = Array.isArray(current) ? current.length : 1
  return (
    <SliderPrimitive.Root value={value} defaultValue={defaultValue} className={cn("w-full", className)} {...props}>
      <SliderPrimitive.Control className="flex h-5 w-full touch-none select-none items-center data-disabled:opacity-50">
        <SliderPrimitive.Track className="h-1 w-full rounded-full bg-secondary">
          <SliderPrimitive.Indicator className="rounded-full bg-primary" />
          {Array.from({ length: thumbs }, (_, i) => (
            <SliderPrimitive.Thumb
              key={i}
              index={thumbs > 1 ? i : undefined}
              aria-label={label}
              aria-labelledby={labelledBy}
              className="size-4 rounded-full border-2 border-primary bg-surface outline-none transition-colors duration-(--duration-fast) hover:bg-muted focus-visible:focus-ring"
            />
          ))}
        </SliderPrimitive.Track>
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  )
}

export { Slider }
export type { SliderProps }
