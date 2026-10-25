import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const transfers = [
  { id: "tx_8f21", to: "Northwind Ltd", status: "Settled", amount: "$12,480.00" },
  { id: "tx_8f1c", to: "Halden Supply", status: "Pending", amount: "$3,200.00" },
  { id: "tx_8e97", to: "Globex", status: "Failed", amount: "$918.40" },
  { id: "tx_8e42", to: "Initech", status: "Settled", amount: "$45,000.00" },
] as const

const tone = { Settled: "success", Pending: "warning", Failed: "danger" } as const

export function Default() {
  return (
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
        {transfers.map(t => (
          <TableRow key={t.id}>
            <TableCell className="figures text-muted-foreground">{t.id}</TableCell>
            <TableCell>{t.to}</TableCell>
            <TableCell>
              <Badge variant={tone[t.status]}>{t.status}</Badge>
            </TableCell>
            <TableCell numeric>{t.amount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
