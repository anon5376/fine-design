import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function Default() {
  return (
    <div className="grid w-full max-w-xs gap-1.5">
      <Label htmlFor="label-name">Name</Label>
      <Input id="label-name" autoComplete="name" />
    </div>
  )
}
