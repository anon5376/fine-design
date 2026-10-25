"use client"

import type { ComponentProps } from "react"
import { Field as FieldPrimitive } from "@base-ui/react/field"
import { Form as FormPrimitive } from "@base-ui/react/form"
import { labelVariants } from "@/components/ui/label"
import { cn } from "@/lib/utils"

/**
 * Form that validates its Fields on submit. `onFormSubmit(values)` receives values keyed by
 * each Field's `name`; `errors` takes server-side errors keyed the same way.
 */
function Form({ className, ...props }: ComponentProps<typeof FormPrimitive>) {
  return <FormPrimitive className={cn("grid gap-4", className)} {...props} />
}

/** Groups a label, one control and its error. Pass `invalid` to show a server-side error. */
function Field({ className, ...props }: ComponentProps<typeof FieldPrimitive.Root>) {
  return <FieldPrimitive.Root className={cn("grid gap-1.5", className)} {...props} />
}

function FieldLabel({ className, ...props }: ComponentProps<typeof FieldPrimitive.Label>) {
  return <FieldPrimitive.Label className={cn(labelVariants(), className)} {...props} />
}

/**
 * Validation message. Shows when the control is invalid; `match` narrows it to one
 * ValidityState key (e.g. "valueMissing"), and `match` with `invalid` on Field forces it.
 */
function FieldError({ className, ...props }: ComponentProps<typeof FieldPrimitive.Error>) {
  return <FieldPrimitive.Error className={cn("text-xs text-danger-subtle-foreground", className)} {...props} />
}

export { Form, Field, FieldLabel, FieldError }
