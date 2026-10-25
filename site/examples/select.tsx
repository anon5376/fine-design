"use client"

import { Field, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"

const networks = [
  { value: "ethereum", label: "Ethereum" },
  { value: "base", label: "Base" },
  { value: "arbitrum", label: "Arbitrum" },
  { value: "optimism", label: "Optimism" },
]

export function Default() {
  return (
    <Field className="w-full max-w-xs">
      <FieldLabel>Network</FieldLabel>
      <Select items={networks} defaultValue="base">
        <SelectTrigger />
        <SelectContent>
          {networks.map(n => (
            <SelectItem key={n.value} value={n.value}>
              {n.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  )
}

export function Disabled() {
  return (
    <Field className="w-full max-w-xs" disabled>
      <FieldLabel>Network</FieldLabel>
      <Select items={networks} defaultValue="ethereum" disabled>
        <SelectTrigger />
        <SelectContent>
          {networks.map(n => (
            <SelectItem key={n.value} value={n.value}>
              {n.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  )
}
