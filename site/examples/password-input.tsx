"use client"

import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { PasswordInput, type Strength } from "@/components/ui/password-input"

// A stand-in scorer: length first, then a mix of cases, digits and symbols.
function score(value: string): Strength {
  if (!value) return 0
  const mixed = /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value)
  const points = Number(value.length >= 8) + Number(value.length >= 12) + Number(mixed) + Number(/[^\w\s]/.test(value))
  return Math.max(1, points) as Strength
}

export function SignUp() {
  return (
    <Field className="w-full max-w-xs">
      <FieldLabel>Password</FieldLabel>
      <PasswordInput autoComplete="new-password" scorer={score} />
      <FieldDescription>At least 12 characters.</FieldDescription>
    </Field>
  )
}

export function SignIn() {
  return (
    <Field className="w-full max-w-xs">
      <FieldLabel>Password</FieldLabel>
      <PasswordInput autoComplete="current-password" defaultValue="northwind-2026" />
    </Field>
  )
}

export function Levels() {
  return (
    <div className="grid w-full max-w-xs gap-4">
      {([1, 2, 3, 4] as const).map(level => (
        <PasswordInput key={level} aria-label={`Level ${level}`} strength={level} defaultValue="northwind" />
      ))}
    </div>
  )
}
