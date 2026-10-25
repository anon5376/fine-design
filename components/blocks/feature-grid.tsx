import type { ReactNode } from "react"
import { ArrowLeftRight, FileText, Globe, ShieldCheck, Wallet, Workflow } from "lucide-react"
import { Heading } from "@/components/ui/heading"
import { Icon, type IconProps } from "@/components/ui/icon"
import { Container, Grid, Stack } from "@/components/ui/layout"
import { Text } from "@/components/ui/text"

type Feature = {
  /** Any SVG component, e.g. a lucide-react icon. Omit for a text-only item. */
  icon?: IconProps["icon"]
  title: ReactNode
  text: ReactNode
}

type FeatureGridProps = {
  heading?: ReactNode
  items?: Feature[]
}

const features: Feature[] = [
  { icon: ArrowLeftRight, title: "Instant transfers", text: "Move funds between wallets in seconds, any day of the week." },
  { icon: FileText, title: "Invoicing", text: "Send an invoice and match the payment when it lands." },
  { icon: Wallet, title: "Multi-currency wallets", text: "Hold and convert 24 currencies at the mid-market rate." },
  { icon: Workflow, title: "Automatic reconciliation", text: "Every payment is matched to its ledger entry as it arrives." },
  { icon: ShieldCheck, title: "Approvals", text: "Require a second signer on payouts above a limit you set." },
  { icon: Globe, title: "Local payouts", text: "Pay suppliers into local bank accounts in 38 countries." },
]

function FeatureGrid({ heading = "Everything your finance team touches", items = features }: FeatureGridProps) {
  return (
    <Container render={<section />} className="py-16 md:py-24">
      <Stack gap="2xl">
        <Heading level={2} size="xl" className="max-w-xl">
          {heading}
        </Heading>
        <Grid minItemWidth="16rem" gap="xl">
          {items.map((f, i) => (
            <Stack key={i} gap="sm">
              {f.icon && <Icon icon={f.icon} size="lg" />}
              <Heading level={3} size="sm" className="font-strong">
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
export type { Feature, FeatureGridProps }
