"use client"

import type { ComponentProps } from "react"
import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"
import { cn } from "@/lib/utils"

// Fluid Functionalism: the check draws on spring.fast's 80ms and retracts on its 60ms exit.
const draw =
  "[stroke-dasharray:1] [stroke-dashoffset:1] transition-[stroke-dashoffset] duration-(--duration-fast-exit) ease-exit motion-reduce:transition-none"

/** Box only. Wrap with a <label> (or use FieldLabel) for the visible label. */
function Checkbox({ className, ...props }: ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        "inline-flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-small border-line border-input bg-surface text-primary-foreground transition-colors duration-(--duration-fast)",
        "outline-none hover:border-muted-foreground focus-visible:focus-ring",
        "data-checked:border-primary data-checked:bg-primary data-indeterminate:border-primary data-indeterminate:bg-primary",
        "aria-invalid:border-danger-subtle-foreground data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator keepMounted className="group/check flex">
        <svg viewBox="0 0 12 12" fill="none" aria-hidden className="size-3">
          <path
            d="M2.5 6.5 5 9l4.5-6"
            pathLength={1}
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn(draw, "group-data-checked/check:[stroke-dashoffset:0] group-data-checked/check:duration-(--duration-fast) group-data-checked/check:ease-enter")}
          />
          <path
            d="M3 6h6"
            pathLength={1}
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
            className={cn(draw, "group-data-indeterminate/check:[stroke-dashoffset:0] group-data-indeterminate/check:duration-(--duration-fast) group-data-indeterminate/check:ease-enter")}
          />
        </svg>
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
