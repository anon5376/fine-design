"use client"

import type { ComponentProps } from "react"
import { Switch as SwitchPrimitive } from "@base-ui/react/switch"
import { cn } from "@/lib/utils"

/**
 * On/off control. Fluid Functionalism motion: the thumb travels on spring.moderate,
 * stretches 2px on hover and 4px while pressed (growing toward the track's middle).
 * The thumb sits inside the track's 2px inset, so its radius is the pill radius minus that inset: a circle when the
 * pill is large, square when the pill is near zero.
 */
function Switch({ className, ...props }: ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "group/switch relative inline-flex h-5 w-[34px] shrink-0 cursor-pointer items-center rounded-pill bg-input p-0.5 transition-colors duration-(--duration-fast)",
        "outline-none focus-visible:focus-ring data-checked:bg-primary data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="block h-4 w-(--thumb) rounded-[max(0px,calc(var(--radius-pill)-2px))] bg-surface [--thumb:16px] transition-[translate,width] duration-(--duration-moderate) ease-spring-moderate group-hover/switch:[--thumb:18px] group-active/switch:[--thumb:20px] data-checked:translate-x-[calc(30px-var(--thumb))] motion-reduce:transition-none" />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
