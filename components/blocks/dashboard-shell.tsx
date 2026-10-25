"use client"

import { useState } from "react"
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
import { IconButton } from "@/components/ui/icon-button"
import { Grid, Stack } from "@/components/ui/layout"
import { Pagination } from "@/components/ui/pagination"
import { Progress } from "@/components/ui/progress"
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarItem } from "@/components/ui/sidebar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Text } from "@/components/ui/text"
import { cn } from "@/lib/utils"

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
function Links() {
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

const wordmark = "text-base font-semibold tracking-tight"

/** App frame that fills its container (give the parent a height). Layout follows the frame's width, not the viewport's. */
export function DashboardShell() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [page, setPage] = useState(1)
  const rows = transfers.slice((page - 1) * pageSize, page * pageSize)

  return (
    <Stack direction="row" gap="none" className="@container h-full min-h-0 w-full overflow-hidden bg-background text-foreground">
      <Sidebar className="hidden @3xl:flex">
        <SidebarHeader>
          <span className={wordmark}>Ledgerly</span>
        </SidebarHeader>
        <SidebarContent aria-label="Workspace">
          <Links />
        </SidebarContent>
      </Sidebar>
      <Stack gap="none" className="min-w-0 flex-1">
        <Stack render={<header />} direction="row" gap="sm" align="center" className="h-14 shrink-0 border-b border-border px-4 @3xl:px-6">
          <Drawer open={menuOpen} onOpenChange={setMenuOpen}>
            <DrawerTrigger render={<IconButton label="Open menu" className="-ml-2 @3xl:hidden" />}>
              <Menu />
            </DrawerTrigger>
            <DrawerContent>
              <DrawerTitle>Ledgerly</DrawerTitle>
              <SidebarContent aria-label="Workspace" onClick={e => (e.target as Element).closest("a") && setMenuOpen(false)}>
                <Links />
              </SidebarContent>
            </DrawerContent>
          </Drawer>
          <Breadcrumb className="min-w-0">
            <BreadcrumbItem>
              <BreadcrumbLink href="#overview">Northwind Ltd</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Overview</BreadcrumbPage>
            </BreadcrumbItem>
          </Breadcrumb>
          <DropdownMenu>
            <DropdownMenuTrigger className="ml-auto shrink-0 cursor-pointer rounded-full outline-none focus-visible:focus-ring">
              <Avatar alt="Maya Okafor" fallback="MO" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuLabel>maya@northwind.co</DropdownMenuLabel>
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
              Overview
            </Heading>
            <Button>
              <Plus />
              New transfer
            </Button>
          </Stack>
          <Grid gap="md" className="grid-cols-1 @lg:grid-cols-2 @7xl:grid-cols-4">
            {metrics.map(metric => (
              <Card key={metric.label} className="gap-1">
                <Text variant="muted">{metric.label}</Text>
                <Text className={cn("figures text-xl font-medium", "main" in metric && "text-accent")}>{metric.value}</Text>
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
        </Stack>
      </Stack>
    </Stack>
  )
}
