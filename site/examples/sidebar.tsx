"use client"

import { useState } from "react"
import { ArrowLeftRight, FileText, LayoutGrid, Settings, Users, Wallet } from "lucide-react"
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarItem } from "@/components/ui/sidebar"

const money = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "transfers", label: "Transfers", icon: ArrowLeftRight, count: 3 },
  { id: "invoices", label: "Invoices", icon: FileText, count: 12 },
  { id: "wallets", label: "Wallets", icon: Wallet },
]

const company = [
  { id: "team", label: "Team", icon: Users, count: 8 },
  { id: "settings", label: "Settings", icon: Settings },
]

const wordmark = "text-base font-strong tracking-tight"

function Items({ items, current, onSelect }: { items: typeof money | typeof company; current: string; onSelect: (id: string) => void }) {
  return items.map(item => (
    <SidebarItem
      key={item.id}
      render={<a href={`#${item.id}`} onClick={() => onSelect(item.id)} />}
      icon={<item.icon />}
      count={"count" in item ? item.count : undefined}
      active={current === item.id}
    >
      {item.label}
    </SidebarItem>
  ))
}

export function Default() {
  const [current, setCurrent] = useState("transfers")
  return (
    <Sidebar className="h-[30rem] rounded-container border-line">
      <SidebarHeader>
        <span className={wordmark}>Ledgerly</span>
      </SidebarHeader>
      <SidebarContent aria-label="Workspace">
        <SidebarGroup>
          <SidebarGroupLabel>Money</SidebarGroupLabel>
          <Items items={money} current={current} onSelect={setCurrent} />
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Company</SidebarGroupLabel>
          <Items items={company} current={current} onSelect={setCurrent} />
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarItem render={<a href="#account" />} icon={<Users />}>
          Amara Okafor
        </SidebarItem>
      </SidebarFooter>
    </Sidebar>
  )
}

export function Compact() {
  const [current, setCurrent] = useState("invoices")
  return (
    <Sidebar size="sm" className="h-96 rounded-container border-line">
      <SidebarHeader>
        <span className={wordmark}>Ledgerly</span>
      </SidebarHeader>
      <SidebarContent aria-label="Workspace, compact">
        <SidebarGroup>
          <SidebarGroupLabel>Money</SidebarGroupLabel>
          <Items items={money} current={current} onSelect={setCurrent} />
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Company</SidebarGroupLabel>
          <Items items={company} current={current} onSelect={setCurrent} />
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
