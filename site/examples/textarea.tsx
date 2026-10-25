import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"

export function Default() {
  return (
    <Field className="w-full max-w-sm">
      <FieldLabel>Memo</FieldLabel>
      <Textarea defaultValue="Q3 vendor payment, invoice 2041." />
    </Field>
  )
}

export function Invalid() {
  return (
    <Field className="w-full max-w-sm" invalid>
      <FieldLabel>Memo</FieldLabel>
      <Textarea defaultValue="" />
      <FieldError match>Add a memo for transfers over $10,000.</FieldError>
    </Field>
  )
}

export function Disabled() {
  return (
    <Field className="w-full max-w-sm" disabled>
      <FieldLabel>Memo</FieldLabel>
      <Textarea defaultValue="Locked after approval." />
    </Field>
  )
}
