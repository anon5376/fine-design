"use client"

import { useState, type ReactNode } from "react"
import { Check } from "lucide-react"
import { AnimatedNumber } from "@/components/ui/animated-number"
import { Button } from "@/components/ui/button"
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Heading } from "@/components/ui/heading"
import { Container, Grid, Stack } from "@/components/ui/layout"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Text } from "@/components/ui/text"

type Billing = "monthly" | "yearly"

type PricingPlan = {
  name: string
  /** Per month, for each billing period. Use the same number twice for a flat price. */
  price: Record<Billing, number>
  /** Button label. */
  action: ReactNode
  /** Primary button instead of outline. */
  recommended?: boolean
  features: string[]
}

type PricingLabels = {
  /** Accessible name of the billing toggle. */
  billing: string
  monthly: ReactNode
  yearly: ReactNode
  /** After the price. */
  unit: ReactNode
}

type PricingProps = {
  heading?: ReactNode
  plans?: PricingPlan[]
  /** Overrides for any of the toggle and price text. */
  labels?: Partial<PricingLabels>
  defaultBilling?: Billing
  /** ISO 4217 code the prices are formatted in. */
  currency?: string
  /** Called when a plan's button is pressed. */
  onSelect?: (plan: PricingPlan, billing: Billing) => void
}

const defaultPlans: PricingPlan[] = [
  {
    name: "Starter",
    price: { monthly: 0, yearly: 0 },
    action: "Start free",
    features: ["2 wallets", "50 transfers a month", "Email support"],
  },
  {
    name: "Growth",
    price: { monthly: 29, yearly: 24 },
    action: "Choose Growth",
    recommended: true,
    features: ["10 wallets", "Unlimited transfers", "Invoices and payment links", "Chat support"],
  },
  {
    name: "Scale",
    price: { monthly: 99, yearly: 82 },
    action: "Choose Scale",
    features: ["Unlimited wallets", "Approval workflows", "Audit log export", "Dedicated account manager"],
  },
]

const defaultLabels: PricingLabels = { billing: "Billing period", monthly: "Monthly", yearly: "Yearly", unit: "per month" }

export function Pricing({
  heading = "Pricing",
  plans = defaultPlans,
  labels,
  defaultBilling = "yearly",
  currency = "USD",
  onSelect,
}: PricingProps) {
  const [billing, setBilling] = useState<Billing>(defaultBilling)
  const copy = { ...defaultLabels, ...labels }

  return (
    <Container render={<section />} className="py-16 md:py-24">
      <Stack gap="xl" align="center">
        <Heading level={2} size="lg">
          {heading}
        </Heading>
        <Tabs value={billing} onValueChange={value => setBilling(value as Billing)}>
          <TabsList aria-label={copy.billing}>
            <TabsTrigger value="monthly">{copy.monthly}</TabsTrigger>
            <TabsTrigger value="yearly">{copy.yearly}</TabsTrigger>
          </TabsList>
        </Tabs>
        <Grid minItemWidth="16rem" gap="md" className="w-full max-w-5xl">
          {plans.map(plan => (
            <Card key={plan.name} className="grid-rows-[auto_auto_1fr_auto] gap-5 p-pad-container-lg">
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
              </CardHeader>
              <Stack direction="row" gap="xs" align="baseline">
                <AnimatedNumber
                  value={plan.price[billing]}
                  format={{ style: "currency", currency, maximumFractionDigits: 0 }}
                  className="text-3xl font-title text-foreground"
                />
                <Text render={<span />} variant="muted">
                  {copy.unit}
                </Text>
              </Stack>
              <Stack render={<ul />} gap="sm" className="text-sm">
                {plan.features.map(feature => (
                  <Stack key={feature} render={<li />} direction="row" gap="sm" align="center">
                    <Check aria-hidden strokeWidth={1.5} className="size-4 shrink-0 text-muted-foreground" />
                    {feature}
                  </Stack>
                ))}
              </Stack>
              <CardFooter>
                <Button variant={plan.recommended ? "primary" : "outline"} size="lg" className="w-full" onClick={() => onSelect?.(plan, billing)}>
                  {plan.action}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </Grid>
      </Stack>
    </Container>
  )
}

export type { Billing, PricingLabels, PricingPlan, PricingProps }
