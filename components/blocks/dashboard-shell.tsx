"use client"

import { Fragment, useState, type ReactNode } from "react"
import { ArrowLeftRight, FileText, LayoutGrid, Menu, Plus, Settings, Users, Wallet } from "lucide-react"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Card, CardHeader } from "@/components/ui/card"
import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Heading } from "@/components/ui/heading"
import type { IconProps } from "@/components/ui/icon"
import { IconButton } from "@/components/ui/icon-button"
import { Grid, Stack } from "@/components/ui/layout"
import { Pagination } from "@/components/ui/pagination"
import { Progress } from "@/components/ui/progress"
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarItem } from "@/components/ui/sidebar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Text } from "@/components/ui/text"
import { cn } from "@/lib/utils"

type NavItem = {
  id: string
  label: string
  /** Any SVG component, e.g. a lucide-react icon. */
  icon?: IconProps["icon"]
  /** Trailing figure, e.g. an open count. */
  count?: ReactNode
  /** Defaults to `#<id>`. */
  href?: string
}
type NavGroup = { label: string; items: NavItem[] }
type Crumb = { label: string; href?: string }
type Account = { name: string; email: string }

const defaultNav: NavGroup[] = [
  {
    label: "Money",
    items: [
      { id: "overview", label: "Overview", icon: LayoutGrid },
      { id: "transfers", label: "Transfers", icon: ArrowLeftRight, count: 3 },
      { id: "invoices", label: "Invoices", icon: FileText, count: 12 },
      { id: "wallets", label: "Wallets", icon: Wallet },
    ],
  },
  {
    label: "Company",
    items: [
      { id: "team", label: "Team", icon: Users },
      { id: "settings", label: "Settings", icon: Settings },
    ],
  },
]

const defaultBreadcrumb: Crumb[] = [{ label: "Northwind Ltd", href: "#overview" }, { label: "Overview" }]
const defaultAccount: Account = { name: "Maya Okafor", email: "maya@northwind.co" }

const metrics = [
  { label: "Available balance", value: "$248,630.42", main: true },
  { label: "Sent this month", value: "$86,420.00" },
  { label: "Received this month", value: "$112,905.18" },
  { label: "Pending", value: "$3,200.00" },
]

const transfers = [
  { id: "tx_8f21", to: "Northwind Ltd", status: "Settled", amount: "$12,480.00" },
  { id: "tx_8f1c", to: "Halden Supply", status: "Pending", amount: "$3,200.00" },
  { id: "tx_8e97", to: "Globex", status: "Failed", amount: "$918.40" },
  { id: "tx_8e42", to: "Initech", status: "Settled", amount: "$45,000.00" },
  { id: "tx_8e10", to: "Umbrella Group", status: "Settled", amount: "$7,150.25" },
  { id: "tx_8dc8", to: "Stark Logistics", status: "Settled", amount: "$2,340.00" },
  { id: "tx_8d9a", to: "Wayne Supply", status: "Pending", amount: "$18,600.00" },
  { id: "tx_8d51", to: "Hooli", status: "Settled", amount: "$960.00" },
  { id: "tx_8d02", to: "Soylent Foods", status: "Failed", amount: "$5,425.90" },
  { id: "tx_8cb7", to: "Vandelay Imports", status: "Settled", amount: "$31,200.00" },
  { id: "tx_8c6e", to: "Pied Piper", status: "Settled", amount: "$1,875.50" },
  { id: "tx_8c23", to: "Oscorp", status: "Settled", amount: "$9,050.00" },
] as const

const tone = { Settled: "success", Pending: "warning", Failed: "danger" } as const
const pageSize = 4

// Rendered twice: in the sidebar from the container's 3xl width up, and in the drawer below it.
function Links({ nav, activeId }: { nav: NavGroup[]; activeId?: string }) {
  return (
    <>
      {nav.map(group => (
        <SidebarGroup key={group.label}>
          <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
          {group.items.map(item => (
            <SidebarItem key={item.id} render={<a href={item.href ?? `#${item.id}`} />} icon={item.icon && <item.icon />} count={item.count} active={item.id === activeId}>
              {item.label}
            </SidebarItem>
          ))}
        </SidebarGroup>
      ))}
    </>
  )
}

const wordmark = "text-base font-strong tracking-tight"

/** The default main content: metrics and a paged table of recent transfers. */
function Overview() {
  const [page, setPage] = useState(1)
  const rows = transfers.slice((page - 1) * pageSize, page * pageSize)

  return (
    <>
    <Grid gap="md" className="grid-cols-1 @lg:grid-cols-2 @7xl:grid-cols-4">
      {metrics.map(metric => (
        <Card key={metric.label} className="gap-1">
          <Text variant="muted">{metric.label}</Text>
          <Text className={cn("figures text-xl font-title", "main" in metric && "text-accent")}>{metric.value}</Text>
        </Card>
      ))}
    </Grid>
    <Grid gap="md" className="items-start @7xl:grid-cols-[minmax(0,1fr)_18rem]">
      <Card>
        <CardHeader>
          <Heading level={2} size="sm">
            Recent transfers
          </Heading>
        </CardHeader>
        <Table aria-label="Recent transfers">
          <TableHeader>
            <TableRow>
              <TableHead>Transfer</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead>Status</TableHead>
              <TableHead numeric>Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(t => (
              <TableRow key={t.id}>
                <TableCell className="figures text-muted-foreground">{t.id}</TableCell>
                <TableCell className="whitespace-nowrap">{t.to}</TableCell>
                <TableCell>
                  <Badge variant={tone[t.status]}>{t.status}</Badge>
                </TableCell>
                <TableCell numeric>{t.amount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Pagination pageCount={Math.ceil(transfers.length / pageSize)} page={page} onPageChange={setPage} className="flex justify-end" />
      </Card>
      <Card>
        <Progress label="Monthly limit used" value={62} />
      </Card>
    </Grid>
    </>
  )
}

type DashboardShellProps = {
  /** Wordmark in the sidebar and the drawer. */
  brand?: ReactNode
  /** Sidebar groups, also shown in the drawer below the container's 3xl width. */
  nav?: NavGroup[]
  /** `id` of the current nav item. */
  activeId?: string
  /** Trail in the top bar; the last entry is the current page. */
  breadcrumb?: Crumb[]
  /** Person in the top bar menu. */
  account?: Account
  /** Page heading, set as the h1. */
  title?: ReactNode
  /** Beside the page heading. */
  actions?: ReactNode
  /** Page content under the heading. Defaults to the transfers overview. */
  children?: ReactNode
}

const initials = (name: string) =>
  name
    .split(" ")
    .map(word => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

/** App frame that fills its container (give the parent a height). Layout follows the frame's width, not the viewport's. */
export function DashboardShell({
  brand = "Ledgerly",
  nav = defaultNav,
  activeId = "overview",
  breadcrumb = defaultBreadcrumb,
  account = defaultAccount,
  title = "Overview",
  actions = (
    <Button>
      <Plus />
      New transfer
    </Button>
  ),
  children = <Overview />,
}: DashboardShellProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <Stack direction="row" gap="none" className="@container h-full min-h-0 w-full overflow-hidden bg-background text-foreground">
      <Sidebar className="hidden @3xl:flex">
        <SidebarHeader>
          <span className={wordmark}>{brand}</span>
        </SidebarHeader>
        <SidebarContent aria-label="Workspace">
          <Links nav={nav} activeId={activeId} />
        </SidebarContent>
      </Sidebar>
      <Stack gap="none" className="min-w-0 flex-1">
        <Stack render={<header />} direction="row" gap="sm" align="center" className="h-14 shrink-0 border-b-line border-border px-4 @3xl:px-6">
          <Drawer open={menuOpen} onOpenChange={setMenuOpen}>
            <DrawerTrigger render={<IconButton label="Open menu" className="-ml-2 @3xl:hidden" />}>
              <Menu />
            </DrawerTrigger>
            <DrawerContent>
              <DrawerTitle>{brand}</DrawerTitle>
              <SidebarContent aria-label="Workspace" onClick={e => (e.target as Element).closest("a") && setMenuOpen(false)}>
                <Links nav={nav} activeId={activeId} />
              </SidebarContent>
            </DrawerContent>
          </Drawer>
          <Breadcrumb className="min-w-0">
            {breadcrumb.map((crumb, i) => (
              <Fragment key={i}>
                {i > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {i === breadcrumb.length - 1 ? <BreadcrumbPage>{crumb.label}</BreadcrumbPage> : <BreadcrumbLink href={crumb.href ?? "#"}>{crumb.label}</BreadcrumbLink>}
                </BreadcrumbItem>
              </Fragment>
            ))}
          </Breadcrumb>
          <DropdownMenu>
            <DropdownMenuTrigger className="ml-auto shrink-0 cursor-pointer rounded-full outline-none focus-visible:focus-ring">
              <Avatar alt={account.name} fallback={initials(account.name)} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuLabel>{account.email}</DropdownMenuLabel>
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </Stack>
        <Stack render={<main />} gap="lg" tabIndex={0} className="min-h-0 flex-1 overflow-y-auto p-4 outline-none focus-visible:-outline-offset-2 focus-visible:focus-ring @3xl:p-6">
          <Stack direction="row" gap="md" align="center" justify="between" wrap>
            <Heading level={1} size="lg">
              {title}
            </Heading>
            {actions}
          </Stack>
          {children}
        </Stack>
      </Stack>
    </Stack>
  )
}

export type { Account, Crumb, DashboardShellProps, NavGroup, NavItem }
