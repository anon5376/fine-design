import { Checkbox } from "@/components/ui/checkbox"

const row = "flex items-center gap-2 text-sm"

export function States() {
  return (
    <div className="grid gap-3">
      <label className={row}>
        <Checkbox />
        Email me a receipt
      </label>
      <label className={row}>
        <Checkbox defaultChecked />
        Require two approvals
      </label>
      <label className={row}>
        <Checkbox indeterminate />
        All wallets
      </label>
      <label className={`${row} text-muted-foreground`}>
        <Checkbox disabled />
        Auto-sweep (plan locked)
      </label>
    </div>
  )
}
