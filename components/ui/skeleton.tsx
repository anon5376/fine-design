import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"

/**
 * Placeholder block. Pulses on the pulse token (Fluid's 2s cycle); holds still under reduced motion. Fills with secondary-hover,
 * since secondary is too close to background and surface in the light theme. Hidden from assistive tech: mark the loading region with aria-busy instead.
 */
function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return <div aria-hidden className={cn("animate-pulse rounded-control bg-secondary-hover motion-reduce:animate-none", className)} {...props} />
}

export { Skeleton }
