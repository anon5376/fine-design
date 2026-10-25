"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Heading } from "@/components/ui/heading"
import { Container, Grid, Stack } from "@/components/ui/layout"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Text } from "@/components/ui/text"

type Billing = "monthly" | "yearly"

const plans = [
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
] as const

export function Pricing() {
  const [billing, setBilling] = useState<Billing>("yearly")

  return (
    <Container render={<section />} className="py-16 md:py-24">
      <Stack gap="xl" align="center">
        <Heading level={2} size="lg">
          Pricing
        </Heading>
        <Tabs value={billing} onValueChange={value => setBilling(value as Billing)}>
          <TabsList aria-label="Billing period">
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="yearly">Yearly</TabsTrigger>
          </TabsList>
        </Tabs>
        <Grid minItemWidth="16rem" gap="md" className="w-full max-w-5xl">
          {plans.map(plan => (
            <Card key={plan.name} className="grid-rows-[auto_auto_1fr_auto] gap-5 p-6">
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
              </CardHeader>
              <Stack direction="row" gap="xs" align="baseline">
                <Text render={<span />} className="figures text-3xl font-medium text-foreground">
                  ${plan.price[billing]}
                </Text>
                <Text render={<span />} variant="muted">
                  per month
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
                <Button variant={"recommended" in plan ? "primary" : "outline"} size="lg" className="w-full">
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
