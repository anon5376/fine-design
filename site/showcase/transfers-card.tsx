"use client"

import { SlidersHorizontal } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { money, type Transfer } from "@/site/showcase/data"

const tone = { Settled: "success", Pending: "warning", Failed: "danger" } as const
const views = [
  { value: "all", label: "All" },
  { value: "in", label: "Incoming" },
  { value: "out", label: "Outgoing" },
] as const

export type View = (typeof views)[number]["value"]

function Rows({ rows }: { rows: Transfer[] }) {
  return (
    <Table aria-label="Recent transfers">
      <TableHeader>
        <TableRow>
          <TableHead>Transfer</TableHead>
          <TableHead>Counterparty</TableHead>
          <TableHead>Status</TableHead>
          <TableHead numeric>Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map(t => (
          <TableRow key={t.id}>
            <TableCell className="figures text-muted-foreground">{t.id}</TableCell>
            <TableCell className="whitespace-nowrap">{t.name}</TableCell>
            <TableCell>
              <Badge variant={tone[t.status]}>{t.status}</Badge>
            </TableCell>
            <TableCell numeric>
              {t.direction === "in" ? "+" : "−"}
              {money(t.amount)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

type Props = {
  view: View
  onViewChange: (view: View) => void
  rows: Transfer[]
  onOpenFilters: () => void
}

export function TransfersCard({ view, onViewChange, rows, onOpenFilters }: Props) {
  return (
    <Card>
      <Tabs value={view} onValueChange={v => onViewChange(v as View)}>
        <CardHeader className="items-center">
          <TabsList>
            {views.map(v => (
              <TabsTrigger key={v.value} value={v.value}>
                {v.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <Button variant="outline" onClick={onOpenFilters}>
            <SlidersHorizontal />
            Filters
          </Button>
        </CardHeader>
        {views.map(v => (
          <TabsContent key={v.value} value={v.value}>
            <Rows rows={rows} />
          </TabsContent>
        ))}
      </Tabs>
    </Card>
  )
}
