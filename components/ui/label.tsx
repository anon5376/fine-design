import type { ComponentProps } from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const labelVariants = cva(
  "inline-flex select-none items-center gap-1.5 text-sm font-medium text-foreground data-disabled:opacity-50",
)

/** Standalone label. Inside a <Field>, use <FieldLabel> so ids wire up automatically. */
function Label({ className, ...props }: ComponentProps<"label">) {
  return <label className={cn(labelVariants(), className)} {...props} />
}

export { Label, labelVariants }
