import { ArrowLeftRight, FileText, Wallet } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const balances = [
  { name: "Operating", amount: "$48,215.60" },
  { name: "Payroll", amount: "$12,904.00" },
  { name: "Tax reserve", amount: "$7,350.25" },
]

const transfers = [
  { id: "tx_8f21", to: "Northwind Ltd", amount: "$12,480.00" },
  { id: "tx_8f1c", to: "Halden Supply", amount: "$3,200.00" },
  { id: "tx_8e97", to: "Globex", amount: "$918.40" },
]

function Rows({ rows }: { rows: { label: string; detail?: string; amount: string }[] }) {
  return (
    <ul className="divide-y divide-border">
      {rows.map(row => (
        <li key={row.label} className="flex h-11 items-center justify-between gap-4">
          <span>
            {row.label}
            {row.detail && <span className="figures ml-2 text-muted-foreground">{row.detail}</span>}
          </span>
          <span className="figures">{row.amount}</span>
        </li>
      ))}
    </ul>
  )
}

const statementRows = [
  { label: "September 2026", amount: "PDF" },
  { label: "August 2026", amount: "PDF" },
]

const balanceRows = balances.map(b => ({ label: b.name, amount: b.amount }))
const transferRows = transfers.map(t => ({ label: t.to, detail: t.id, amount: t.amount }))

export function Segmented() {
  return (
    <Tabs defaultValue="balances" className="w-full max-w-md">
      <TabsList>
        <TabsTrigger value="balances">Balances</TabsTrigger>
        <TabsTrigger value="transfers">Transfers</TabsTrigger>
        <TabsTrigger value="statements">Statements</TabsTrigger>
      </TabsList>
      <TabsContent value="balances">
        <Rows rows={balanceRows} />
      </TabsContent>
      <TabsContent value="transfers">
        <Rows rows={transferRows} />
      </TabsContent>
      <TabsContent value="statements">
        <Rows rows={statementRows} />
      </TabsContent>
    </Tabs>
  )
}

export function Underline() {
  return (
    <Tabs variant="underline" defaultValue="transfers" className="w-full max-w-md">
      <TabsList>
        <TabsTrigger value="balances">Balances</TabsTrigger>
        <TabsTrigger value="transfers">Transfers</TabsTrigger>
        <TabsTrigger value="statements">Statements</TabsTrigger>
      </TabsList>
      <TabsContent value="balances">
        <Rows rows={balanceRows} />
      </TabsContent>
      <TabsContent value="transfers">
        <Rows rows={transferRows} />
      </TabsContent>
      <TabsContent value="statements">
        <Rows rows={statementRows} />
      </TabsContent>
    </Tabs>
  )
}

export function Sizes() {
  return (
    <div className="grid w-full max-w-md gap-8">
      <Tabs size="sm" defaultValue="balances">
        <TabsList>
          <TabsTrigger value="balances">Balances</TabsTrigger>
          <TabsTrigger value="transfers">Transfers</TabsTrigger>
        </TabsList>
        <TabsContent value="balances">
          <Rows rows={balanceRows.slice(0, 2)} />
        </TabsContent>
        <TabsContent value="transfers">
          <Rows rows={transferRows.slice(0, 2)} />
        </TabsContent>
      </Tabs>
      <Tabs size="sm" variant="underline" defaultValue="balances">
        <TabsList>
          <TabsTrigger value="balances">Balances</TabsTrigger>
          <TabsTrigger value="transfers">Transfers</TabsTrigger>
        </TabsList>
        <TabsContent value="balances">
          <Rows rows={balanceRows.slice(0, 2)} />
        </TabsContent>
        <TabsContent value="transfers">
          <Rows rows={transferRows.slice(0, 2)} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export function WithIcons() {
  return (
    <Tabs defaultValue="balances" className="w-full max-w-md">
      <TabsList>
        <TabsTrigger value="balances">
          <Wallet />
          Balances
        </TabsTrigger>
        <TabsTrigger value="transfers">
          <ArrowLeftRight />
          Transfers
        </TabsTrigger>
        <TabsTrigger value="statements">
          <FileText />
          Statements
        </TabsTrigger>
      </TabsList>
      <TabsContent value="balances">
        <Rows rows={balanceRows} />
      </TabsContent>
      <TabsContent value="transfers">
        <Rows rows={transferRows} />
      </TabsContent>
      <TabsContent value="statements">
        <Rows rows={statementRows.slice(0, 1)} />
      </TabsContent>
    </Tabs>
  )
}

export function DisabledTab() {
  return (
    <div className="grid w-full max-w-md gap-8">
      <Tabs defaultValue="balances">
        <TabsList>
          <TabsTrigger value="balances">Balances</TabsTrigger>
          <TabsTrigger value="transfers">Transfers</TabsTrigger>
          <TabsTrigger value="statements" disabled>
            Statements
          </TabsTrigger>
        </TabsList>
        <TabsContent value="balances">
          <Rows rows={balanceRows} />
        </TabsContent>
        <TabsContent value="transfers">
          <Rows rows={transferRows} />
        </TabsContent>
      </Tabs>
      <Tabs variant="underline" defaultValue="balances">
        <TabsList>
          <TabsTrigger value="balances">Balances</TabsTrigger>
          <TabsTrigger value="transfers">Transfers</TabsTrigger>
          <TabsTrigger value="statements" disabled>
            Statements
          </TabsTrigger>
        </TabsList>
        <TabsContent value="balances">
          <Rows rows={balanceRows} />
        </TabsContent>
        <TabsContent value="transfers">
          <Rows rows={transferRows} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
