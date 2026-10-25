import { Separator } from "@/components/ui/separator"

export function Horizontal() {
  return (
    <div className="grid w-full max-w-xs gap-3 text-sm">
      <span>Account</span>
      <Separator />
      <span>Billing</span>
    </div>
  )
}

export function Vertical() {
  return (
    <div className="flex h-5 items-center gap-3 text-sm">
      <span>Docs</span>
      <Separator orientation="vertical" />
      <span>Changelog</span>
      <Separator orientation="vertical" />
      <span>Status</span>
    </div>
  )
}
