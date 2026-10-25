"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarItem } from "@/components/ui/sidebar"
import { blocks, components } from "@/site/nav"

const GROUPS = [
  { title: "Foundations", items: [{ href: "/tokens/", title: "Tokens" }] },
  { title: "Components", items: components.map(c => ({ href: `/components/${c.slug}/`, title: c.title })) },
  { title: "Blocks", items: blocks.map(b => ({ href: `/blocks/${b.slug}/`, title: b.title })) },
]

export function SiteNav() {
  const pathname = usePathname()

  return (
    <SidebarContent aria-label="Docs">
      {GROUPS.map(group => (
        <SidebarGroup key={group.title}>
          <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
          {group.items.map(item => (
            <SidebarItem key={item.href} render={<Link href={item.href} />} active={pathname === item.href}>
              {item.title}
            </SidebarItem>
          ))}
        </SidebarGroup>
      ))}
    </SidebarContent>
  )
}
