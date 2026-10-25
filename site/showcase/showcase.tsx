"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowLeftRight, Menu, Plus, RefreshCw, Search, SlidersHorizontal } from "lucide-react"
import { AnimatedNumber } from "@/components/ui/animated-number"
import { Avatar } from "@/components/ui/avatar"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CommandPalette, type CommandGroup } from "@/components/ui/command-palette"
import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Heading } from "@/components/ui/heading"
import { IconButton } from "@/components/ui/icon-button"
import { Kbd } from "@/components/ui/kbd"
import { Grid, Stack } from "@/components/ui/layout"
import { Sidebar, SidebarContent, SidebarHeader } from "@/components/ui/sidebar"
import { Text } from "@/components/ui/text"
import { toast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/site/theme-toggle"
import { amountMax, incoming, initialTransfers, money, start, statuses as allStatuses, type Status, type Transfer } from "@/site/showcase/data"
import { FiltersDrawer } from "@/site/showcase/filters-drawer"
import { NewTransferDialog } from "@/site/showcase/new-transfer-dialog"
import { SidebarLinks } from "@/site/showcase/sidebar-links"
import { TransfersCard, type View } from "@/site/showcase/transfers-card"

const wordmark = "text-base font-semibold tracking-tight"
const usd = { style: "currency", currency: "USD" } as const

/** A payments app made only of Fine's components: every control here is live, which is also what the promo reel drives. */
export function Showcase() {
  const [balance, setBalance] = useState(start.balance)
  const [sent, setSent] = useState(start.sent)
  const [received, setReceived] = useState(start.received)
  const [transfers, setTransfers] = useState<Transfer[]>(initialTransfers)
  const [view, setView] = useState<View>("all")
  const [statuses, setStatuses] = useState<Status[]>(allStatuses)
  const [range, setRange] = useState([0, amountMax])
  const [palette, setPalette] = useState(false)
  const [dialog, setDialog] = useState(false)
  const [filters, setFilters] = useState(false)
  const [menu, setMenu] = useState(false)
  const synced = useRef(0)
  const serial = useRef(0x9a00)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setPalette(o => !o)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const nextId = () => `tx_${(++serial.current).toString(16)}`

  function sync() {
    const { name, amount } = incoming[synced.current++ % incoming.length]
    setTransfers(t => [{ id: nextId(), name, status: "Settled", amount, direction: "in" }, ...t])
    setBalance(b => b + amount)
    setReceived(r => r + amount)
    toast.add({ title: `Received ${money(amount)}`, type: "success" })
  }

  function send({ name, amount }: { name: string; amount: number }) {
    setTransfers(t => [{ id: nextId(), name, status: "Pending", amount, direction: "out" }, ...t])
    setBalance(b => b - amount)
    setSent(s => s + amount)
    toast.add({ title: "Transfer sent", type: "success" })
  }

  const rows = transfers
    .filter(t => (view === "all" || t.direction === view) && statuses.includes(t.status) && t.amount >= range[0] && t.amount <= range[1])
    .slice(0, 5)

  const groups: CommandGroup[] = [
    {
      label: "Actions",
      items: [
        { id: "new-transfer", label: "New transfer", icon: Plus, onSelect: () => setDialog(true) },
        { id: "sync", label: "Sync transfers", icon: ArrowLeftRight, onSelect: sync },
        { id: "filters", label: "Open filters", icon: SlidersHorizontal, onSelect: () => setFilters(true) },
      ],
    },
  ]

  const metrics = [
    { label: "Available balance", value: balance, main: true },
    { label: "Sent this month", value: sent },
    { label: "Received this month", value: received },
  ]

  return (
    <div data-showcase className="fixed inset-0 z-(--z-sticky) flex flex-col bg-background text-foreground">
      <Stack direction="row" gap="none" className="@container min-h-0 flex-1 overflow-hidden">
        <Sidebar className="hidden @3xl:flex">
          <SidebarHeader>
            <span className={wordmark}>Ledgerly</span>
          </SidebarHeader>
          <SidebarContent aria-label="Workspace">
            <SidebarLinks />
          </SidebarContent>
        </Sidebar>
        <Stack gap="none" className="min-w-0 flex-1">
          <Stack render={<header />} direction="row" gap="sm" align="center" className="h-14 shrink-0 border-b border-border px-4 @3xl:px-6">
            <Drawer open={menu} onOpenChange={setMenu} side="left">
              <DrawerTrigger render={<IconButton label="Open menu" className="-ml-2 @3xl:hidden" />}>
                <Menu />
              </DrawerTrigger>
              <DrawerContent>
                <DrawerTitle>Ledgerly</DrawerTitle>
                <SidebarContent aria-label="Workspace" onClick={e => (e.target as Element).closest("a") && setMenu(false)}>
                  <SidebarLinks />
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
            <Stack direction="row" gap="xs" align="center" className="ml-auto shrink-0">
              <Button variant="outline" onClick={() => setPalette(true)} className="mr-1">
                <Search />
                Search
                <span className="flex gap-0.5">
                  <Kbd>⌘</Kbd>
                  <Kbd>K</Kbd>
                </span>
              </Button>
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger className="ml-1 shrink-0 cursor-pointer rounded-full outline-none focus-visible:focus-ring">
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
          </Stack>
          <Stack render={<main />} gap="lg" tabIndex={0} className="min-h-0 flex-1 overflow-y-auto p-4 outline-none focus-visible:-outline-offset-2 focus-visible:focus-ring @3xl:p-6">
            <Stack direction="row" gap="md" align="center" justify="between" wrap>
              <Heading level={1} size="lg">
                Overview
              </Heading>
              <Button onClick={() => setDialog(true)}>
                <Plus />
                New transfer
              </Button>
            </Stack>
            <Grid gap="md" className="grid-cols-1 @2xl:grid-cols-3">
              {metrics.map(metric => (
                <Card key={metric.label} className="relative gap-1">
                  <Text variant="muted">{metric.label}</Text>
                  {metric.main && (
                    <IconButton label="Sync transfers" onClick={sync} className="absolute top-3 right-3">
                      <RefreshCw />
                    </IconButton>
                  )}
                  <AnimatedNumber value={metric.value} format={usd} className={cn("text-2xl font-medium", metric.main && "text-accent")} />
                </Card>
              ))}
            </Grid>
            <TransfersCard view={view} onViewChange={setView} rows={rows} onOpenFilters={() => setFilters(true)} />
          </Stack>
        </Stack>
      </Stack>
      <footer className="flex h-12 shrink-0 items-center justify-center gap-4 border-t border-border px-4 md:px-6">
        <span className={wordmark}>fine</span>
        <span className="figures text-sm text-muted-foreground">github.com/anon5376/fine-design</span>
      </footer>
      <CommandPalette open={palette} onOpenChange={setPalette} groups={groups} />
      <NewTransferDialog open={dialog} onOpenChange={setDialog} onSend={send} />
      <FiltersDrawer
        open={filters}
        onOpenChange={setFilters}
        statuses={statuses}
        onStatusesChange={setStatuses}
        range={range}
        onRangeChange={setRange}
        onReset={() => {
          setStatuses(allStatuses)
          setRange([0, amountMax])
        }}
      />
    </div>
  )
}
