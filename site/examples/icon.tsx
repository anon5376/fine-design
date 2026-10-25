import { Bell, Settings, Wallet } from "lucide-react"
import { Icon } from "@/components/ui/icon"

export function Sizes() {
  return (
    <>
      <Icon icon={Wallet} size="sm" />
      <Icon icon={Wallet} size="md" />
      <Icon icon={Wallet} size="lg" />
    </>
  )
}

export function Labelled() {
  return (
    <>
      <Icon icon={Bell} label="3 unread notifications" />
      <Icon icon={Settings} className="text-muted-foreground" />
    </>
  )
}
