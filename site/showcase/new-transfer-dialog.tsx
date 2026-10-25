"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from "@/components/ui/combobox"
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { networks, recipients } from "@/site/showcase/data"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSend: (transfer: { name: string; amount: number }) => void
}

/** Holds the Send button in its loading state for a beat, as a request would, then closes and reports the transfer. */
export function NewTransferDialog({ open, onOpenChange, onSend }: Props) {
  const [recipient, setRecipient] = useState<string | null>(null)
  const [network, setNetwork] = useState("ach")
  const [amount, setAmount] = useState("")
  const [sending, setSending] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const value = Number(amount.replace(/,/g, ""))

  useEffect(() => {
    if (!open) return
    setRecipient(null)
    setNetwork("ach")
    setAmount("")
  }, [open])
  useEffect(() => () => clearTimeout(timer.current), [])

  function send() {
    if (!recipient || !(value > 0)) return
    setSending(true)
    timer.current = setTimeout(() => {
      setSending(false)
      onOpenChange(false)
      onSend({ name: recipient, amount: value })
    }, 600)
  }

  return (
    <Dialog open={open} onOpenChange={o => !sending && onOpenChange(o)}>
      <DialogContent className="max-w-lg">
        <DialogTitle>New transfer</DialogTitle>
        <form
          className="grid gap-4"
          onSubmit={e => {
            e.preventDefault()
            send()
          }}
        >
          <Field>
            <FieldLabel>Recipient</FieldLabel>
            <Combobox items={recipients} value={recipient} onValueChange={setRecipient}>
              <ComboboxInput />
              <ComboboxContent>
                <ComboboxEmpty>No recipients match.</ComboboxEmpty>
                <ComboboxList>
                  {(name: string) => (
                    <ComboboxItem key={name} value={name}>
                      {name}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </Field>
          <Field>
            <FieldLabel>Network</FieldLabel>
            <Select items={networks} value={network} onValueChange={v => v && setNetwork(v)}>
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
          <Field>
            <FieldLabel>Amount</FieldLabel>
            <Input className="figures" inputMode="decimal" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9.,]/g, ""))} />
          </Field>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" disabled={sending} />}>Cancel</DialogClose>
            <Button type="submit" loading={sending} disabled={!recipient || !(value > 0)}>
              Send
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
