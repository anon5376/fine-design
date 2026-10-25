import { Alert } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

export function Variants() {
  return (
    <div className="grid w-full max-w-lg gap-3">
      <Alert title="Statements for October are ready." />
      <Alert variant="info" title="Settlement moves to 17:00 UTC on Monday." />
      <Alert variant="success" title="Bank account verified." />
      <Alert variant="warning" title="Two approvals still needed for transfer tx_8f1c." />
      <Alert variant="danger" title="Payout to Globex failed." />
    </div>
  )
}

export function WithBodyAndAction() {
  return (
    <Alert
      variant="danger"
      title="Payout to Globex failed."
      action={
        <Button size="sm" variant="outline">
          Retry payout
        </Button>
      }
      className="w-full max-w-lg"
    >
      The receiving bank rejected account ending 4410.
    </Alert>
  )
}
