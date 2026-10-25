import { Pricing } from "@/components/blocks/pricing"

export function TwoPlansInEuros() {
  return (
    <Pricing
      heading="Plans"
      currency="EUR"
      defaultBilling="monthly"
      labels={{ yearly: "Annual", unit: "a month" }}
      plans={[
        { name: "Solo", price: { monthly: 12, yearly: 10 }, action: "Start with Solo", features: ["1 wallet", "Unlimited transfers"] },
        {
          name: "Team",
          price: { monthly: 45, yearly: 38 },
          action: "Start with Team",
          recommended: true,
          features: ["10 wallets", "Unlimited transfers", "Approval workflows"],
        },
      ]}
    />
  )
}
