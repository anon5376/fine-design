"use client"

import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldLabel, Form } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function Default() {
  return (
    <Field className="w-full max-w-xs">
      <FieldLabel>Name</FieldLabel>
      <Input autoComplete="name" />
    </Field>
  )
}

export function ServerError() {
  return (
    <Field className="w-full max-w-xs" invalid>
      <FieldLabel>Email</FieldLabel>
      <Input type="email" defaultValue="ada@northwind.dev" />
      <FieldError match>This email is already registered.</FieldError>
    </Field>
  )
}

export function ValidateOnSubmit() {
  return (
    <Form className="w-full max-w-xs" onFormSubmit={() => {}}>
      <Field name="email">
        <FieldLabel>Email</FieldLabel>
        <Input type="email" required />
        <FieldError match="valueMissing">Enter your email.</FieldError>
        <FieldError match="typeMismatch">Enter a valid email address.</FieldError>
      </Field>
      <Button type="submit" className="justify-self-start">
        Save
      </Button>
    </Form>
  )
}

export function WithHint() {
  return (
    <Form className="w-full max-w-xs" onFormSubmit={() => {}}>
      <Field name="password">
        <FieldLabel>Password</FieldLabel>
        <Input type="password" autoComplete="new-password" required minLength={12} />
        <FieldDescription>At least 12 characters.</FieldDescription>
        <FieldError match="valueMissing">Enter a password.</FieldError>
        <FieldError match="tooShort">Use at least 12 characters.</FieldError>
      </Field>
      <Button type="submit" className="justify-self-start">
        Create account
      </Button>
    </Form>
  )
}
