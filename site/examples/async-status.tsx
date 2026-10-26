"use client"

import { useEffect, useRef, useState } from "react"
import { AsyncStatus, type AsyncState } from "@/components/ui/async-status"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

/** A fake network call: resolves after `ms`, or rejects when `fail` is set. */
const request = (ms: number, fail = false) => new Promise<void>((resolve, reject) => setTimeout(fail ? reject : resolve, ms))

export function Autosave() {
  const [state, setState] = useState<AsyncState>("success")
  const saves = useRef(0)

  async function save() {
    const id = ++saves.current
    setState("pending")
    await request(900)
    if (id === saves.current) setState("success")
  }

  return (
    <div className="grid w-full max-w-xs gap-2">
      <Input aria-label="Wallet name" defaultValue="Operating" onChange={save} />
      <AsyncStatus state={state} />
    </div>
  )
}

export function Retry() {
  const [state, setState] = useState<AsyncState>("idle")
  const attempts = useRef(0)

  async function sync() {
    setState("pending")
    try {
      await request(1000, attempts.current++ % 2 === 0)
      setState("success")
    } catch {
      setState("error")
    }
  }

  return (
    <div className="flex items-center gap-4">
      <Button variant="outline" onClick={sync} disabled={state === "pending"}>
        Sync ledger
      </Button>
      <AsyncStatus state={state} labels={{ pending: "Syncing", success: "Synced", error: "Sync failed" }} />
    </div>
  )
}

export function States() {
  const [state, setState] = useState<AsyncState>("idle")
  useEffect(() => {
    if (state === "pending") {
      const id = setTimeout(() => setState("success"), 1200)
      return () => clearTimeout(id)
    }
  }, [state])

  return (
    <div className="grid justify-items-center gap-4">
      <AsyncStatus state={state} />
      <div className="flex flex-wrap justify-center gap-2">
        {(["idle", "pending", "success", "error"] as const).map(s => (
          <Button key={s} size="sm" variant={state === s ? "primary" : "outline"} onClick={() => setState(s)}>
            {s}
          </Button>
        ))}
      </div>
    </div>
  )
}
