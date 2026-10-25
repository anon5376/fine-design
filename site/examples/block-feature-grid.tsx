import { Bell, Receipt, Users } from "lucide-react"
import { FeatureGrid } from "@/components/blocks/feature-grid"

export function HeadingAndThreeItems() {
  return (
    <FeatureGrid
      heading="Built for small teams"
      items={[
        { icon: Receipt, title: "Receipts", text: "Photograph a receipt and it attaches itself to the right expense." },
        { icon: Users, title: "Shared cards", text: "Give each person a card with its own monthly limit." },
        { icon: Bell, title: "Alerts", text: "Hear about unusual spending the moment it happens." },
      ]}
    />
  )
}
