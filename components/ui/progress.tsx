"use client"

import { useEffect, useRef, type ComponentProps } from "react"
import { Progress as ProgressPrimitive } from "@base-ui/react/progress"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const progressVariants = cva(
  "h-full rounded-full transition-[width] duration-(--duration-slow) ease-enter data-indeterminate:w-full data-indeterminate:motion-safe:animate-pulse motion-reduce:transition-none",
  {
    variants: {
      // `accent` is for the one figure the screen is about; everything else stays ink.
      // Indeterminate is a tinted fill, so it never reads as a complete bar, pulsing or still.
      variant: { default: "bg-primary data-indeterminate:bg-primary/60", accent: "bg-accent data-indeterminate:bg-accent/60" },
    },
    defaultVariants: { variant: "default" },
  },
)

type ProgressProps = ComponentProps<typeof ProgressPrimitive.Root> &
  VariantProps<typeof progressVariants> & {
    /** Visible label; also the bar's accessible name. */
    label: string
    /** Show the formatted value next to the label. */
    showValue?: boolean
  }

/**
 * Pass value={null} for indeterminate: a tinted full-width fill pulsing on the pulse token (Fluid's skeleton cycle), still under reduced motion.
 * The fill eases forward on the slow tier (Fluid's tiers; no source has a progress bar) and jumps on a decrease or when leaving indeterminate.
 */
function Progress({ className, variant, label, showValue = true, ...props }: ProgressProps) {
  const last = useRef(props.value)
  const reset = props.value != null && (last.current == null || props.value < last.current)
  useEffect(() => {
    last.current = props.value
  })
  return (
    <ProgressPrimitive.Root className={cn("grid w-full gap-1.5", className)} {...props}>
      <div className="flex items-baseline justify-between gap-4 text-sm">
        <ProgressPrimitive.Label className="font-medium text-foreground">{label}</ProgressPrimitive.Label>
        {showValue && <ProgressPrimitive.Value className="figures text-muted-foreground" />}
      </div>
      <ProgressPrimitive.Track className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <ProgressPrimitive.Indicator className={cn(progressVariants({ variant }), reset && "transition-none")} />
      </ProgressPrimitive.Track>
    </ProgressPrimitive.Root>
  )
}

export { Progress, progressVariants }
export type { ProgressProps }
