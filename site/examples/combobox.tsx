"use client"

import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from "@/components/ui/combobox"
import { Field, FieldLabel } from "@/components/ui/field"

const tokens = ["Ether", "USD Coin", "Tether", "Dai", "Wrapped Bitcoin", "Chainlink", "Uniswap", "Aave"]

export function Default() {
  return (
    <Field className="w-full max-w-xs">
      <FieldLabel>Token</FieldLabel>
      <Combobox items={tokens}>
        <ComboboxInput />
        <ComboboxContent>
          <ComboboxEmpty>No tokens match.</ComboboxEmpty>
          <ComboboxList>
            {(token: string) => (
              <ComboboxItem key={token} value={token}>
                {token}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </Field>
  )
}
