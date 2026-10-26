"use client"

import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Caret } from "./shared"

// The real Field, FieldLabel, Input, FieldDescription and FieldError. Invalid and the typed value come from the film clock; the
// real caret does not blink on the clock, so a transparent copy of the text carries a drawn one at the exact end of the value.
// The hint and the error take a larger type step than their defaults (xs): at film scale the hint is the point of the shot.
export function PasswordField({ value, invalid, typing, caret }: { value: string; invalid: boolean; typing: boolean; caret: boolean }) {
  return (
    <Field invalid={invalid}>
      <FieldLabel>Password</FieldLabel>
      <div className="relative">
        <Input
          size="lg"
          type="text"
          value={value}
          onChange={() => {}}
          tabIndex={-1}
          // The focus ring and border are the component's own focus styles, held on while the caret is typing.
          className={cn("caret-transparent", typing && "focus-ring border-ring", invalid && "border-danger-subtle-foreground")}
          style={{ transitionDuration: "160ms" }}
        />
        <div aria-hidden className="pointer-events-none absolute inset-y-0 flex items-center whitespace-pre text-sm text-transparent" style={{ left: "calc(var(--border-width) + var(--pad-field-md))" }}>
          {value}
          <Caret on={caret} style={{ marginLeft: 1, marginRight: -2 }} />
        </div>
      </div>
      <FieldDescription className="text-xl">At least 12 characters</FieldDescription>
      <FieldError match={invalid} className="text-base">
        Too short
      </FieldError>
    </Field>
  )
}
