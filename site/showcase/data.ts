export type Status = "Settled" | "Pending" | "Failed"
export type Transfer = { id: string; name: string; status: Status; amount: number; direction: "in" | "out" }

export const statuses: Status[] = ["Settled", "Pending", "Failed"]
export const amountMax = 50000
export const recipients = ["Halden Supply", "Globex", "Initech", "Umbrella Group", "Stark Logistics", "Wayne Supply", "Hooli", "Soylent Foods", "Vandelay Imports", "Pied Piper", "Oscorp"]
export const networks = [
  { value: "ach", label: "ACH" },
  { value: "wire", label: "Wire" },
  { value: "sepa", label: "SEPA" },
  { value: "rtp", label: "Real-time" },
]

export const start = { balance: 248630.42, sent: 86420, received: 112905.18 }

export const initialTransfers: Transfer[] = [
  { id: "tx_8f21", name: "Globex", status: "Settled", amount: 8900, direction: "in" },
  { id: "tx_8f1c", name: "Halden Supply", status: "Pending", amount: 3200, direction: "out" },
  { id: "tx_8e97", name: "Umbrella Group", status: "Failed", amount: 918.4, direction: "out" },
  { id: "tx_8e42", name: "Initech", status: "Settled", amount: 45000, direction: "in" },
  { id: "tx_8e10", name: "Stark Logistics", status: "Settled", amount: 7150.25, direction: "out" },
  { id: "tx_8dc8", name: "Wayne Supply", status: "Pending", amount: 2340, direction: "in" },
  { id: "tx_8d9a", name: "Hooli", status: "Settled", amount: 18600, direction: "out" },
  { id: "tx_8d51", name: "Soylent Foods", status: "Settled", amount: 960, direction: "in" },
]

/** What the sync control brings in, one per press, then it starts over. */
export const incoming = [
  { name: "Vandelay Imports", amount: 12480 },
  { name: "Oscorp", amount: 5275.5 },
  { name: "Pied Piper", amount: 9150 },
]

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })
export const money = (n: number) => usd.format(n)
