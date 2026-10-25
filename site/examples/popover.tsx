"use client"

import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Popover, PopoverClose, PopoverContent, PopoverTitle, PopoverTrigger } from "@/components/ui/popover"

export function Default() {
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" />}>Set limit</PopoverTrigger>
      <PopoverContent>
        <PopoverTitle>Daily limit</PopoverTitle>
        <Field>
          <FieldLabel>Amount</FieldLabel>
          <Input inputMode="decimal" defaultValue="25,000" />
        </Field>
        <PopoverClose render={<Button size="sm" className="justify-self-end" />}>Save</PopoverClose>
      </PopoverContent>
    </Popover>
  )
}
