import { ArrowLeftRight, FileText, Globe, ShieldCheck, Wallet, Workflow } from "lucide-react"
import { Heading } from "@/components/ui/heading"
import { Icon } from "@/components/ui/icon"
import { Container, Grid, Stack } from "@/components/ui/layout"
import { Text } from "@/components/ui/text"

const features = [
  { icon: ArrowLeftRight, title: "Instant transfers", text: "Move funds between wallets in seconds, any day of the week." },
  { icon: FileText, title: "Invoicing", text: "Send an invoice and match the payment when it lands." },
  { icon: Wallet, title: "Multi-currency wallets", text: "Hold and convert 24 currencies at the mid-market rate." },
  { icon: Workflow, title: "Automatic reconciliation", text: "Every payment is matched to its ledger entry as it arrives." },
  { icon: ShieldCheck, title: "Approvals", text: "Require a second signer on payouts above a limit you set." },
  { icon: Globe, title: "Local payouts", text: "Pay suppliers into local bank accounts in 38 countries." },
]

function FeatureGrid() {
  return (
    <Container render={<section />} className="py-16 md:py-24">
      <Stack gap="2xl">
        <Heading level={2} size="xl" className="max-w-xl">
          Everything your finance team touches
        </Heading>
        <Grid minItemWidth="16rem" gap="xl">
          {features.map(f => (
            <Stack key={f.title} gap="sm">
              <Icon icon={f.icon} size="lg" />
              <Heading level={3} size="sm" className="font-semibold">
                {f.title}
              </Heading>
              <Text variant="muted">{f.text}</Text>
            </Stack>
          ))}
        </Grid>
      </Stack>
    </Container>
  )
}

export { FeatureGrid }
