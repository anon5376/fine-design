"use client"

import type { ComponentProps } from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const inputVariants = cva(
  [
    "w-full min-w-0 rounded-control border-line border-input bg-surface text-foreground transition-colors duration-(--duration-fast)",
    "placeholder:text-muted-foreground hover:border-muted-foreground",
    "outline-none focus-visible:focus-ring focus-visible:border-ring focus-visible:outline-offset-0",
    "aria-invalid:border-danger-subtle-foreground data-invalid:border-danger-subtle-foreground",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "file:border-0 file:bg-transparent file:font-label file:text-foreground",
  ],
  {
    variants: {
      size: {
        sm: "h-control-sm px-pad-field-sm text-xs",
        md: "h-control-md px-pad-field-md text-sm",
        lg: "h-control-lg px-pad-field-md text-sm",
      },
    },
    defaultVariants: { size: "md" },
  },
)

type InputProps = Omit<ComponentProps<typeof InputPrimitive>, "size"> & VariantProps<typeof inputVariants>

/** Text input. Inside <Field> it picks up the label, error and invalid state. */
function Input({ className, size, ...props }: InputProps) {
  return <InputPrimitive className={cn(inputVariants({ size }), className)} {...props} />
}

export { Input, inputVariants }
export type { InputProps }
