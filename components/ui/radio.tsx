"use client"

import type { ComponentProps } from "react"
import { Radio as RadioPrimitive } from "@base-ui/react/radio"
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group"
import { cn } from "@/lib/utils"

/** Holds the value and arrow-key navigation. Give it an aria-label or aria-labelledby. */
function RadioGroup({ className, ...props }: ComponentProps<typeof RadioGroupPrimitive>) {
  return <RadioGroupPrimitive className={cn("grid gap-2.5", className)} {...props} />
}

/** Circle only. Wrap with a <label> for the visible label. */
function Radio({ className, ...props }: ComponentProps<typeof RadioPrimitive.Root>) {
  return (
    <RadioPrimitive.Root
      className={cn(
        "inline-flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-full border border-input bg-surface transition-colors duration-(--duration-fast)",
        "outline-none hover:border-muted-foreground focus-visible:focus-ring data-checked:border-primary",
        "data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {/* Fluid Functionalism: the dot pops in from scale 0.3 on spring.fast and leaves on its exit. */}
      <RadioPrimitive.Indicator
        keepMounted
        className="size-2 rounded-full bg-primary transition-[scale,opacity] duration-(--duration-fast) ease-enter data-unchecked:scale-30 data-unchecked:opacity-0 data-unchecked:duration-(--duration-fast-exit) data-unchecked:ease-exit motion-reduce:transition-opacity"
      />
    </RadioPrimitive.Root>
  )
}

export { RadioGroup, Radio }
