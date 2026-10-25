import { Switch } from "@/components/ui/switch"

const row = "flex items-center justify-between gap-6 text-sm"

export function States() {
  return (
    <div className="grid w-full max-w-xs gap-4">
      <label className={row}>
        Two-factor login
        <Switch defaultChecked />
      </label>
      <label className={row}>
        Weekly summary email
        <Switch />
      </label>
      <label className={`${row} text-muted-foreground`}>
        Audit log export
        <Switch disabled />
      </label>
    </div>
  )
}
