"use client"

import { memo, type ComponentType } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Bold, Check, Image as ImageIcon, Italic, Link as LinkIcon, List, Underline } from "lucide-react"
import { clamp, lerp, progress, ease } from "../clock"
import { Alert } from "@/components/ui/alert"
import { AnimatedNumber } from "@/components/ui/animated-number"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Combobox } from "@/components/ui/combobox"
import { ComboboxInput } from "@/components/ui/combobox"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { IconButton } from "@/components/ui/icon-button"
import { Input } from "@/components/ui/input"
import { Kbd } from "@/components/ui/kbd"
import { Label } from "@/components/ui/label"
import { Pagination } from "@/components/ui/pagination"
import { Progress } from "@/components/ui/progress"
import { Radio, RadioGroup } from "@/components/ui/radio"
import { Select, SelectTrigger } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tag, TagList } from "@/components/ui/tag"
import { Textarea } from "@/components/ui/textarea"

// The 30 live components on S3's board. Each is a real fine component driven only through props; `drive` turns film
// time (t) and the tile's trigger time (tr) into those props, and every content component is memoized on primitives,
// so a tile re-renders only when its own state steps. Natural width is 240px; the tile scales it up.

const noop = () => {}

/** How many of `max` steps have fired: 0 before tr, then +1 every `gap` seconds. */
const step = (t: number, tr: number, gap: number, max: number) => (t < tr ? 0 : Math.min(max, 1 + Math.floor((t - tr) / gap)))
/** Characters typed so far at `cps`, starting at tr. */
const typedLen = (t: number, tr: number, len: number, cps = 20) => clamp(Math.floor((t - tr) * cps), 0, len)
/** A value eased between a and b from tr over dur, rounded. */
const sweep = (t: number, tr: number, dur: number, a: number, b: number) => Math.round(lerp(a, b, ease.inOut(progress(t, tr, dur))))

const row = "flex items-center justify-between gap-3"

const SwitchTile = memo(function SwitchTile({ n }: { n: number }) {
  return (
    <div className="grid gap-4">
      <div className={row}>
        <Label>Auto-pay</Label>
        <Badge variant={n >= 1 ? "success" : "neutral"}>{n >= 1 ? "On" : "Off"}</Badge>
      </div>
      <div className={row}>
        <span className="text-sm text-muted-foreground">Every 1st of the month</span>
        <Switch checked={n >= 1} aria-label="Auto-pay" />
      </div>
    </div>
  )
})

const CheckboxTile = memo(function CheckboxTile({ n }: { n: number }) {
  const rows = [
    ["Invoices", true],
    ["Receipts", n >= 1],
    ["Reports", n >= 2],
  ] as const
  return (
    <div className="grid gap-3">
      {rows.map(([label, on]) => (
        <label key={label} className="flex items-center gap-2.5 text-sm font-medium">
          <Checkbox checked={on} />
          {label}
        </label>
      ))}
    </div>
  )
})

const RadioTile = memo(function RadioTile({ n }: { n: number }) {
  return (
    <RadioGroup aria-label="Delivery" value={n >= 1 ? "express" : "standard"}>
      {[
        ["standard", "Standard"],
        ["express", "Express"],
        ["overnight", "Overnight"],
      ].map(([value, label]) => (
        <label key={value} className="flex items-center gap-2.5 text-sm font-medium">
          <Radio value={value} />
          {label}
        </label>
      ))}
    </RadioGroup>
  )
})

const billing = [
  { value: "monthly", label: "Monthly" },
  { value: "annual", label: "Annual" },
]
const SelectTile = memo(function SelectTile({ n }: { n: number }) {
  return (
    <div className="grid gap-1.5">
      <Label>Billing</Label>
      <Select items={billing} value={n >= 1 ? "annual" : "monthly"} onValueChange={noop}>
        <SelectTrigger />
      </Select>
    </div>
  )
})

const EMAIL = "ada@fine.design"
const InputTile = memo(function InputTile({ k }: { k: number }) {
  return (
    <div className="grid gap-1.5">
      <Label>Email</Label>
      <Input value={EMAIL.slice(0, k)} placeholder="name@company.com" readOnly />
    </div>
  )
})

const SliderTile = memo(function SliderTile({ v }: { v: number }) {
  return (
    <div className="grid gap-3">
      <div className="flex items-baseline justify-between text-sm">
        <Label>Volume</Label>
        <span className="figures text-muted-foreground">{v}</span>
      </div>
      <Slider value={v} onValueChange={noop} aria-label="Volume" />
    </div>
  )
})

const ProgressTile = memo(function ProgressTile({ v }: { v: number }) {
  return <Progress label="Storage" value={v} />
})

const BadgesTile = memo(function BadgesTile({ n }: { n: number }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge>Draft</Badge>
      <Badge variant="outline">Archived</Badge>
      <Badge variant="success">Paid</Badge>
      <Badge variant={n >= 1 ? "success" : "warning"}>{n >= 1 ? "Settled" : "Pending"}</Badge>
      <Badge variant={n >= 2 ? "info" : "danger"}>{n >= 2 ? "Retried" : "Failed"}</Badge>
      <Badge variant="info">Sent</Badge>
    </div>
  )
})

const TagsTile = memo(function TagsTile({ n }: { n: number }) {
  const tags = ["Design", "Tokens", "Motion", "Base UI", "Ink"].filter(tag => !(tag === "Tokens" && n >= 1) && !(tag === "Motion" && n >= 2))
  return (
    <TagList>
      {tags.map(tag => (
        <Tag key={tag} onRemove={noop}>
          {tag}
        </Tag>
      ))}
    </TagList>
  )
})

const people = ["AK", "JR", "MT", "SL", "DP"]
const AvatarsTile = memo(function AvatarsTile({ n }: { n: number }) {
  return (
    <div className="grid justify-items-center gap-3">
      <div className="flex -space-x-2.5">
        <AnimatePresence initial={false}>
          {people.slice(0, 3 + n).map(p => (
            <motion.span key={p} initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", visualDuration: 0.42, bounce: 0.28 }}>
              <Avatar alt={p} fallback={p} size="lg" className="ring-2 ring-surface" />
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
      <Badge variant="outline" className="figures">
        {3 + n} reviewers
      </Badge>
    </div>
  )
})

const KbdTile = memo(function KbdTile({ n }: { n: number }) {
  const combos = [
    ["Search", ["Ctrl", "K"]],
    ["Command", ["Shift", "Ctrl", "P"]],
    ["Close", ["Esc"]],
  ] as const
  return (
    <div className="grid gap-3.5">
      {combos.map(([label, keys], i) => (
        <div key={label} className={row}>
          <span className="text-sm font-medium">{label}</span>
          <span className="flex gap-1">
            {keys.map(k => (
              <Kbd key={k} className={n === i + 1 ? "border-primary bg-primary text-primary-foreground" : undefined}>
                {k}
              </Kbd>
            ))}
          </span>
        </div>
      ))}
    </div>
  )
})

const tabIds = ["overview", "billing", "team"]
const TabsTile = memo(function TabsTile({ n }: { n: number }) {
  return (
    <Tabs value={tabIds[n]} onValueChange={noop} size="sm" className="gap-3">
      <TabsList className="w-full">
        {["Overview", "Billing", "Team"].map((l, i) => (
          <TabsTrigger key={l} value={tabIds[i]} className="flex-1">
            {l}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value="overview" className="grid gap-1">
        <span className="text-muted-foreground">Balance</span>
        <span className="figures text-xl font-semibold">$12,480.00</span>
      </TabsContent>
      <TabsContent value="billing" className="grid gap-1">
        <span className="text-muted-foreground">Next invoice</span>
        <span className="figures text-xl font-semibold">$2,140.00</span>
      </TabsContent>
      <TabsContent value="team" className="grid gap-1">
        <span className="text-muted-foreground">Seats</span>
        <span className="figures text-xl font-semibold">18 of 25</span>
      </TabsContent>
    </Tabs>
  )
})

const PaginationTile = memo(function PaginationTile({ p }: { p: number }) {
  return (
    <div className="flex justify-center">
      <Pagination pageCount={7} page={p} onPageChange={noop} size="sm" />
    </div>
  )
})

const crumbs = ["Select", "Combobox", "Slider"]
const BreadcrumbTile = memo(function BreadcrumbTile({ n }: { n: number }) {
  return (
    <div className="grid gap-1">
      <Breadcrumb>
        <BreadcrumbItem>
          <BreadcrumbLink href="#">Fine</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="#">Components</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{crumbs[n]}</BreadcrumbPage>
        </BreadcrumbItem>
      </Breadcrumb>
      <Separator className="my-2" />
      <Breadcrumb>
        <BreadcrumbItem>
          <BreadcrumbLink href="#">Fine</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="#">Blocks</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Pricing</BreadcrumbPage>
        </BreadcrumbItem>
      </Breadcrumb>
    </div>
  )
})

const AlertTile = memo(function AlertTile({ n }: { n: number }) {
  return (
    <Alert variant={n >= 1 ? "success" : "info"} title={n >= 1 ? "Payment sent" : "Sending payment"}>
      <span className="figures">$12,480.00</span> to Northwind
    </Alert>
  )
})

const AlertWarnTile = memo(function AlertWarnTile({ n }: { n: number }) {
  return (
    <Alert variant={n >= 1 ? "danger" : "warning"} title={n >= 1 ? "Card declined" : "Card expires soon"}>
      Visa ending <span className="figures">4242</span>
    </Alert>
  )
})

const periods = ["Day", "Week", "Month"]
const ButtonGroupTile = memo(function ButtonGroupTile({ n }: { n: number }) {
  return (
    <div className="flex justify-center gap-1.5">
      {periods.map((p, i) => (
        <Button key={p} variant={i === n ? "primary" : "outline"}>
          {p}
        </Button>
      ))}
    </div>
  )
})

const money = { style: "currency", currency: "USD" } as const
const NumberTile = memo(function NumberTile({ v }: { v: number }) {
  return (
    <div className="grid gap-2">
      <span className="text-sm text-muted-foreground">Balance</span>
      <AnimatedNumber value={v} format={money} className="text-[30px] font-semibold leading-none tracking-tight text-accent" />
      <div className="flex items-center gap-2 text-sm">
        <Badge variant="success">Up</Badge>
        <span className="text-muted-foreground">this month</span>
      </div>
    </div>
  )
})

const SkeletonTile = memo(function SkeletonTile() {
  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-full" />
        <div className="grid flex-1 gap-2">
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-14 w-full" />
    </div>
  )
})

const SeparatorTile = memo(function SeparatorTile({ n }: { n: number }) {
  const nav = ["Overview", "Billing", "Team"]
  return (
    <div className="grid gap-2.5 text-sm">
      <div className="flex h-5 items-center gap-3">
        {nav.map((l, i) => (
          <span key={l} className="contents">
            {i > 0 && <Separator orientation="vertical" />}
            <span className={i === n ? "font-medium" : "text-muted-foreground"}>{l}</span>
          </span>
        ))}
      </div>
      <Separator />
      <div className="flex justify-between text-muted-foreground">
        <span>Subtotal</span>
        <span className="figures">$11,200.00</span>
      </div>
      <div className="flex justify-between text-muted-foreground">
        <span>Tax</span>
        <span className="figures">$1,280.00</span>
      </div>
      <Separator />
      <div className="flex justify-between font-medium">
        <span>Total</span>
        <span className="figures">$12,480.00</span>
      </div>
    </div>
  )
})

const tokens = ["Ether", "USD Coin", "Tether", "Dai"]
const TOKEN = "USD Coin"
const ComboboxTile = memo(function ComboboxTile({ k }: { k: number }) {
  return (
    <div className="grid gap-1.5">
      <Label>Token</Label>
      <Combobox items={tokens} inputValue={TOKEN.slice(0, k)} onInputValueChange={noop}>
        <ComboboxInput placeholder="Search tokens" />
      </Combobox>
    </div>
  )
})

const tools = [
  ["Bold", Bold],
  ["Italic", Italic],
  ["Underline", Underline],
  ["Link", LinkIcon],
  ["List", List],
  ["Image", ImageIcon],
] as const
const activeTool = [0, 0, 2, 4, 3]
const IconButtonsTile = memo(function IconButtonsTile({ n }: { n: number }) {
  return (
    <div className="flex justify-between">
      {tools.map(([label, Icon], i) => (
        <IconButton key={label} label={label} variant={i === activeTool[n] ? "secondary" : "ghost"}>
          <Icon />
        </IconButton>
      ))}
    </div>
  )
})

const NOTE = "Net 30. Paid by wire on delivery."
const TextareaTile = memo(function TextareaTile({ k }: { k: number }) {
  return (
    <div className="grid gap-1.5">
      <Label>Note</Label>
      <Textarea value={NOTE.slice(0, k)} placeholder="Add a note" readOnly rows={3} className="h-[84px] resize-none" />
    </div>
  )
})

const FieldTile = memo(function FieldTile({ n }: { n: number }) {
  return (
    <Field invalid={n >= 1}>
      <FieldLabel>Amount</FieldLabel>
      <Input value="12,480.00" readOnly className="figures" />
      <div className="h-4">
        <FieldError match>Over the $10,000 limit</FieldError>
      </div>
    </Field>
  )
})

const CardTile = memo(function CardTile({ paid, pending }: { paid: number; pending: number }) {
  return (
    <Card className="gap-3 border-0 bg-transparent p-0">
      <CardHeader className="items-center">
        <CardTitle>Revenue</CardTitle>
        <Badge variant="success">+12%</Badge>
      </CardHeader>
      <CardContent className="gap-2.5">
        <div className={row}>
          <span className="text-muted-foreground">Paid</span>
          <AnimatedNumber value={paid} format={money} className="font-medium" />
        </div>
        <div className={row}>
          <span className="text-muted-foreground">Pending</span>
          <AnimatedNumber value={pending} format={money} className="font-medium" />
        </div>
        <Separator />
        <div className={row}>
          <span className="text-muted-foreground">Overdue</span>
          <span className="figures font-medium">$4,520.00</span>
        </div>
      </CardContent>
    </Card>
  )
})

const SwitchTrioTile = memo(function SwitchTrioTile({ n }: { n: number }) {
  const rows = [
    ["Email", true],
    ["SMS", n >= 1],
    ["Push", n >= 2],
  ] as const
  return (
    <div className="grid gap-3.5">
      {rows.map(([label, on]) => (
        <div key={label} className={row}>
          <Label>{label}</Label>
          <Switch checked={on} aria-label={label} />
        </div>
      ))}
    </div>
  )
})

const SliderRangeTile = memo(function SliderRangeTile({ a, b }: { a: number; b: number }) {
  return (
    <div className="grid gap-3">
      <div className="flex items-baseline justify-between text-sm">
        <Label>Price</Label>
        <span className="figures text-muted-foreground">
          ${a} to ${b}
        </span>
      </div>
      <Slider value={[a, b]} onValueChange={noop} aria-label="Price" />
    </div>
  )
})

const ProgressTrioTile = memo(function ProgressTrioTile({ a, b, c }: { a: number; b: number; c: number }) {
  return (
    <div className="grid gap-3.5">
      <Progress label="Build" value={a} />
      <Progress label="Test" value={b} />
      <Progress label="Deploy" value={c} />
    </div>
  )
})

const underlineIds = ["invoices", "customers", "reports"]
const TabsUnderlineTile = memo(function TabsUnderlineTile({ n }: { n: number }) {
  return (
    <Tabs value={underlineIds[n]} onValueChange={noop} variant="underline" size="sm" className="gap-4">
      <TabsList>
        {["Invoices", "Customers", "Reports"].map((l, i) => (
          <TabsTrigger key={l} value={underlineIds[i]}>
            {l}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value="invoices" className="figures text-xl font-semibold">
        128 open
      </TabsContent>
      <TabsContent value="customers" className="figures text-xl font-semibold">
        2,041
      </TabsContent>
      <TabsContent value="reports" className="figures text-xl font-semibold">
        36 ready
      </TabsContent>
    </Tabs>
  )
})

const ButtonLoadingTile = memo(function ButtonLoadingTile({ n }: { n: number }) {
  return (
    <div className="flex justify-center gap-2">
      <Button variant={n >= 2 ? "secondary" : "primary"} loading={n === 1}>
        {n >= 2 ? (
          <>
            <Check /> Paid
          </>
        ) : (
          <>
            Pay <span className="figures">$240</span>
          </>
        )}
      </Button>
      <Button variant="ghost">Cancel</Button>
    </div>
  )
})

export type TileDef = {
  id: string
  /** Content scale inside the 340x210 tile (default 1.25). */
  scale?: number
  Content: ComponentType<any>
  drive: (t: number, tr: number) => Record<string, number | string | boolean>
}

/** Row-major, 6 columns by 5 rows. */
export const TILES: TileDef[] = [
  // row 0
  { id: "switch", Content: SwitchTile, drive: (t, tr) => ({ n: step(t, tr, 9, 1) }) },
  { id: "separator", Content: SeparatorTile, drive: (t, tr) => ({ n: step(t, tr, 0.55, 3) % 3 }) },
  { id: "tags", Content: TagsTile, drive: (t, tr) => ({ n: step(t, tr, 0.7, 2) }) },
  { id: "select", Content: SelectTile, drive: (t, tr) => ({ n: step(t, tr, 9, 1) }) },
  { id: "kbd", Content: KbdTile, drive: (t, tr) => ({ n: step(t, tr, 0.5, 3) }) },
  { id: "breadcrumb", Content: BreadcrumbTile, drive: (t, tr) => ({ n: step(t, tr, 0.7, 3) % 3 }) },
  // row 1
  { id: "progress", Content: ProgressTile, drive: (t, tr) => ({ v: sweep(t, tr, 1.1, 18, 92) }) },
  { id: "checkbox", Content: CheckboxTile, drive: (t, tr) => ({ n: step(t, tr, 0.35, 2) }) },
  { id: "number", Content: NumberTile, drive: (t, tr) => ({ v: [12480, 14920, 15305][step(t, tr, 0.9, 2)] }) },
  { id: "tabs", Content: TabsTile, drive: (t, tr) => ({ n: step(t, tr, 0.6, 2) }) },
  { id: "iconbuttons", Content: IconButtonsTile, drive: (t, tr) => ({ n: step(t, tr, 0.4, 4) }) },
  { id: "tabs-underline", Content: TabsUnderlineTile, drive: (t, tr) => ({ n: step(t, tr, 0.6, 2) }) },
  // row 2
  { id: "radio", Content: RadioTile, drive: (t, tr) => ({ n: step(t, tr, 9, 1) }) },
  { id: "card", Content: CardTile, drive: (t, tr) => ({ paid: step(t, tr, 9, 1) ? 33640 : 31200, pending: step(t, tr + 0.25, 9, 1) ? 10040 : 12480 }) },
  { id: "avatars", Content: AvatarsTile, drive: (t, tr) => ({ n: step(t, tr, 0.35, 2) }) },
  { id: "slider", Content: SliderTile, drive: (t, tr) => ({ v: sweep(t, tr, 1.2, 18, 74) }) },
  { id: "pagination", Content: PaginationTile, scale: 1.05, drive: (t, tr) => ({ p: 2 + step(t, tr, 0.45, 3) }) },
  { id: "alert-info", Content: AlertTile, drive: (t, tr) => ({ n: step(t, tr, 9, 1) }) },
  // row 3
  { id: "skeleton", Content: SkeletonTile, drive: () => ({}) },
  { id: "badges", Content: BadgesTile, drive: (t, tr) => ({ n: step(t, tr, 0.6, 2) }) },
  { id: "button-group", Content: ButtonGroupTile, drive: (t, tr) => ({ n: step(t, tr, 0.45, 3) % 3 }) },
  { id: "field", Content: FieldTile, drive: (t, tr) => ({ n: step(t, tr, 9, 1) }) },
  { id: "combobox", Content: ComboboxTile, drive: (t, tr) => ({ k: typedLen(t, tr, TOKEN.length, 12) }) },
  { id: "alert-warn", Content: AlertWarnTile, drive: (t, tr) => ({ n: step(t, tr, 9, 1) }) },
  // row 4
  { id: "input", Content: InputTile, drive: (t, tr) => ({ k: typedLen(t, tr, EMAIL.length, 16) }) },
  { id: "switch-trio", Content: SwitchTrioTile, drive: (t, tr) => ({ n: step(t, tr, 0.3, 2) }) },
  { id: "slider-range", Content: SliderRangeTile, drive: (t, tr) => ({ a: sweep(t, tr, 1.2, 20, 36), b: sweep(t, tr, 1.2, 62, 90) }) },
  { id: "progress-trio", Content: ProgressTrioTile, drive: (t, tr) => ({ a: sweep(t, tr, 0.9, 30, 100), b: sweep(t, tr + 0.25, 0.9, 12, 78), c: sweep(t, tr + 0.5, 0.9, 0, 46) }) },
  { id: "textarea", Content: TextareaTile, drive: (t, tr) => ({ k: typedLen(t, tr, NOTE.length, 22) }) },
  { id: "button-loading", Content: ButtonLoadingTile, drive: (t, tr) => ({ n: t < tr ? 0 : t < tr + 0.9 ? 1 : 2 }) },
]
