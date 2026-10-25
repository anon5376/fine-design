import { Radio, RadioGroup } from "@/components/ui/radio"

const row = "flex items-center gap-2 text-sm"

export function Default() {
  return (
    <RadioGroup aria-label="Payout schedule" defaultValue="weekly">
      <label className={row}>
        <Radio value="daily" />
        Daily
      </label>
      <label className={row}>
        <Radio value="weekly" />
        Weekly
      </label>
      <label className={row}>
        <Radio value="monthly" />
        Monthly
      </label>
      <label className={`${row} text-muted-foreground`}>
        <Radio value="instant" disabled />
        Instant (plan locked)
      </label>
    </RadioGroup>
  )
}
