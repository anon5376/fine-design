import { Container, Grid, Stack } from "@/components/ui/layout"

const box = "rounded-control bg-muted px-3 py-2 text-sm"

export function StackColumn() {
  return (
    <Stack gap="sm" className="w-full max-w-xs">
      <div className={box}>Account</div>
      <div className={box}>Billing</div>
      <div className={box}>Members</div>
    </Stack>
  )
}

export function StackRow() {
  return (
    <Stack direction="row" gap="sm" align="center" wrap>
      <div className={box}>Draft</div>
      <div className={box}>Review</div>
      <div className={box}>Live</div>
    </Stack>
  )
}

export function GridColumns() {
  return (
    <Grid cols={3} gap="sm" className="w-full">
      {["Revenue", "Payouts", "Fees", "Refunds", "Disputes", "Net"].map(label => (
        <div key={label} className={box}>
          {label}
        </div>
      ))}
    </Grid>
  )
}

export function GridReflow() {
  return (
    <Grid minItemWidth="9rem" gap="sm" className="w-full">
      {["Ether", "Bitcoin", "USD Coin", "Solana", "Polygon"].map(label => (
        <div key={label} className={box}>
          {label}
        </div>
      ))}
    </Grid>
  )
}

export function ContainerSizes() {
  return (
    <Stack gap="sm" className="w-full">
      <Container size="sm" className={box}>
        sm · 42rem
      </Container>
      <Container size="md" className={box}>
        md · 56rem
      </Container>
    </Stack>
  )
}
