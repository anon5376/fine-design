import { Text } from "@/components/ui/text"

export function Sizes() {
  return (
    <div className="grid gap-2">
      <Text size="lg">Settlement runs every weekday at 17:00 UTC.</Text>
      <Text size="md">Settlement runs every weekday at 17:00 UTC.</Text>
      <Text size="sm">Settlement runs every weekday at 17:00 UTC.</Text>
      <Text size="xs">Settlement runs every weekday at 17:00 UTC.</Text>
    </div>
  )
}

export function Variants() {
  return (
    <div className="grid gap-2">
      <Text>Payout scheduled.</Text>
      <Text variant="muted">Last synced 4 minutes ago.</Text>
      <Text variant="success">Payout sent.</Text>
      <Text variant="warning">Payout delayed by the bank.</Text>
      <Text variant="danger">Payout failed.</Text>
    </div>
  )
}

export function Inline() {
  return (
    <Text>
      Fee: <Text render={<span />} className="figures">$2.40</Text> per transfer.
    </Text>
  )
}
