"use client"

import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"

export function Types() {
  return (
    <>
      <Button variant="outline" onClick={() => toast.add({ title: "Transfer sent", type: "success" })}>
        Success
      </Button>
      <Button variant="outline" onClick={() => toast.add({ title: "Card declined", type: "error" })}>
        Error
      </Button>
      <Button variant="outline" onClick={() => toast.add({ title: "Draft saved" })}>
        Plain
      </Button>
    </>
  )
}

export function WithAction() {
  return (
    <Button
      variant="outline"
      onClick={() => {
        const id = toast.add({
          title: "Invoice archived",
          actionProps: { children: "Undo", onClick: () => toast.close(id) },
        })
      }}
    >
      Archive invoice
    </Button>
  )
}

export function Promise() {
  return (
    <Button
      variant="outline"
      onClick={() =>
        toast.promise(new globalThis.Promise(resolve => setTimeout(resolve, 1600)), {
          loading: "Exporting ledger",
          success: "Ledger exported",
          error: "Export failed",
        })
      }
    >
      Export ledger
    </Button>
  )
}
