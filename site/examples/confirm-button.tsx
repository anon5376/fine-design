"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ConfirmButton } from "@/components/ui/confirm-button"

const initial = [
  { id: "2041", amount: "$1,280.00" },
  { id: "2042", amount: "$412.50" },
  { id: "2043", amount: "$9,060.00" },
]

export function DeleteInvoice() {
  const [invoices, setInvoices] = useState(initial)
  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      {invoices.map(invoice => (
        <div key={invoice.id} className="flex items-center justify-between gap-3">
          <span className="text-sm">
            <span className="figures">{invoice.id}</span> <span className="figures text-muted-foreground">{invoice.amount}</span>
          </span>
          <ConfirmButton size="sm" question="Delete?" confirmLabel="Delete" onConfirm={() => setInvoices(list => list.filter(i => i.id !== invoice.id))}>
            Delete
          </ConfirmButton>
        </div>
      ))}
      {invoices.length < initial.length && (
        <Button variant="outline" size="sm" className="self-start" onClick={() => setInvoices(initial)}>
          Restore invoices
        </Button>
      )}
    </div>
  )
}

export function DiscardDraft() {
  const [discarded, setDiscarded] = useState(false)
  return (
    <>
      <ConfirmButton
        question="Discard this draft?"
        confirmLabel="Discard"
        onConfirm={async () => {
          await new Promise(resolve => setTimeout(resolve, 1200))
          setDiscarded(true)
        }}
      >
        Discard draft
      </ConfirmButton>
      {discarded && (
        <Button variant="outline" onClick={() => setDiscarded(false)}>
          Start a new draft
        </Button>
      )}
    </>
  )
}
