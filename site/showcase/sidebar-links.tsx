import { ArrowLeftRight, FileText, LayoutGrid, Settings, Users, Wallet } from "lucide-react"
import { SidebarGroup, SidebarGroupLabel, SidebarItem } from "@/components/ui/sidebar"

const money = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "transfers", label: "Transfers", icon: ArrowLeftRight, count: 3 },
  { id: "invoices", label: "Invoices", icon: FileText, count: 12 },
  { id: "wallets", label: "Wallets", icon: Wallet },
]

const company = [
  { id: "team", label: "Team", icon: Users },
  { id: "settings", label: "Settings", icon: Settings },
]

// Rendered in the sidebar from the frame's 3xl width up, and in the menu drawer below it.
export function SidebarLinks() {
  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>Money</SidebarGroupLabel>
        {money.map(item => (
          <SidebarItem key={item.id} render={<a href={`#${item.id}`} />} icon={<item.icon />} count={"count" in item ? item.count : undefined} active={item.id === "overview"}>
            {item.label}
          </SidebarItem>
        ))}
      </SidebarGroup>
      <SidebarGroup>
        <SidebarGroupLabel>Company</SidebarGroupLabel>
        {company.map(item => (
          <SidebarItem key={item.id} render={<a href={`#${item.id}`} />} icon={<item.icon />}>
            {item.label}
          </SidebarItem>
        ))}
      </SidebarGroup>
    </>
  )
}
