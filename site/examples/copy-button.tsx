"use client"

import { CopyButton } from "@/components/ui/copy-button"
import { Input } from "@/components/ui/input"

export function ApiKey() {
  return (
    <div className="flex items-center gap-2">
      <code className="figures font-mono text-sm">sk_live_4eC39HqLyjWDarjt</code>
      <CopyButton text="sk_live_4eC39HqLyjWDarjt" label="Copy API key" />
    </div>
  )
}

export function ShareLink() {
  return (
    <div className="flex w-full max-w-sm items-center gap-2">
      <Input readOnly aria-label="Invoice link" defaultValue="https://pay.example.com/i/2041" />
      <CopyButton variant="outline" text="https://pay.example.com/i/2041" label="Copy invoice link" />
    </div>
  )
}

export function Snippet() {
  return (
    <div className="relative w-full max-w-md rounded-container border-line border-border bg-muted py-3 pr-12 pl-4">
      <code className="font-mono text-sm">npx shadcn add copy-button</code>
      <CopyButton className="absolute top-1.5 right-1.5" text="npx shadcn add copy-button" label="Copy command" />
    </div>
  )
}
