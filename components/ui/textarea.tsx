"use client"

import type { ComponentProps } from "react"
import { Field as FieldPrimitive } from "@base-ui/react/field"
import { cn } from "@/lib/utils"

/** Multi-line text. Inside <Field> it picks up the label, error and invalid state. */
function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <FieldPrimitive.Control
      render={
        <textarea
          className={cn(
            "min-h-20 w-full min-w-0 resize-y rounded-control border border-input bg-surface px-3 py-2 text-sm text-foreground transition-colors duration-(--duration-fast)",
            "placeholder:text-muted-foreground hover:border-muted-foreground",
            "outline-none focus-visible:focus-ring focus-visible:border-ring focus-visible:outline-offset-0",
            "aria-invalid:border-danger-subtle-foreground data-invalid:border-danger-subtle-foreground disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
          {...props}
        />
      }
    />
  )
}

export { Textarea }
