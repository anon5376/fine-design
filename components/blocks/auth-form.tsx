"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader } from "@/components/ui/card"
import { Field, FieldError, FieldLabel, Form } from "@/components/ui/field"
import { Heading } from "@/components/ui/heading"
import { Input } from "@/components/ui/input"

type AuthFormProps = {
  /** Called with valid values. Resolve with field errors (keyed by name) to show them. */
  onSubmit?: (values: { email: string; password: string }) => Promise<Record<string, string> | void>
}

export function AuthForm({ onSubmit }: AuthFormProps) {
  const [pending, setPending] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  return (
    <Card className="w-full max-w-sm gap-6 p-6">
      <CardHeader>
        <Heading level={2} size="md" className="text-xl font-semibold tracking-tight">
          Sign in
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
          Sign in
        </Button>
      </Form>
    </Card>
  )
}
