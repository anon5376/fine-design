import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function Default() {
  return (
    <div className="grid w-full max-w-xs gap-1.5">
      <Label htmlFor="input-email">Email</Label>
      <Input id="input-email" type="email" autoComplete="email" />
    </div>
  )
}

export function Sizes() {
  return (
    <div className="grid w-full max-w-xs gap-3">
      <Input size="sm" aria-label="Small" defaultValue="Small" />
      <Input size="md" aria-label="Medium" defaultValue="Medium" />
      <Input size="lg" aria-label="Large" defaultValue="Large" />
    </div>
  )
}

export function Invalid() {
  return (
    <div className="grid w-full max-w-xs gap-1.5">
      <Label htmlFor="input-invalid">Email</Label>
      <Input id="input-invalid" type="email" defaultValue="ada@" aria-invalid />
    </div>
  )
}

export function Disabled() {
  return (
    <div className="grid w-full max-w-xs gap-1.5">
      <Label htmlFor="input-disabled">Workspace</Label>
      <Input id="input-disabled" defaultValue="northwind" disabled />
    </div>
  )
}
