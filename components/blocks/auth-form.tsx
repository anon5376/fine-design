"use client"

import { useState, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader } from "@/components/ui/card"
import { Field, FieldError, FieldLabel, Form } from "@/components/ui/field"
import { Heading } from "@/components/ui/heading"
import { Input } from "@/components/ui/input"

type AuthFormProps = {
  /** Card heading. */
  title?: ReactNode
  /** Submit button label. */
  submitLabel?: ReactNode
  /** Below the form, inside the card: a reset link, a switch to sign up. */
  footer?: ReactNode
  /** Called with valid values. Resolve with field errors (keyed by name) to show them. */
  onSubmit?: (values: { email: string; password: string }) => Promise<Record<string, string> | void>
}

export function AuthForm({ title = "Sign in", submitLabel = "Sign in", footer, onSubmit }: AuthFormProps) {
  const [pending, setPending] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  return (
    <Card className="w-full max-w-sm gap-6 p-pad-container-lg">
      <CardHeader>
        <Heading level={2} size="md" className="text-xl font-strong tracking-tight">
          {title}
        </Heading>
      </CardHeader>
      <Form
        errors={errors}
        onFormSubmit={async values => {
          setPending(true)
          setErrors((await onSubmit?.(values as { email: string; password: string })) ?? {})
          setPending(false)
        }}
      >
        <Field name="email">
          <FieldLabel>Email</FieldLabel>
          <Input type="email" autoComplete="email" required />
          <FieldError match="valueMissing">Enter your email.</FieldError>
          <FieldError match="typeMismatch">Enter a valid email address.</FieldError>
          <FieldError />
        </Field>
        <Field name="password">
          <FieldLabel>Password</FieldLabel>
          <Input type="password" autoComplete="current-password" required />
          <FieldError match="valueMissing">Enter your password.</FieldError>
          <FieldError />
        </Field>
        <Button type="submit" size="lg" loading={pending} className="mt-2 w-full">
          {submitLabel}
        </Button>
      </Form>
      {footer}
    </Card>
  )
}

export type { AuthFormProps }
