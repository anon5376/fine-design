import type { ReactNode } from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Heading } from "@/components/ui/heading"
import { Container, Stack } from "@/components/ui/layout"

type FaqItem = {
  /** Unique key; what `defaultValue` refers to. */
  value: string
  question: ReactNode
  answer: ReactNode
}

type FaqProps = {
  heading?: ReactNode
  items?: FaqItem[]
  /** Values of the items open on first render. Defaults to the first item. */
  defaultValue?: string[]
}

const questions: FaqItem[] = [
  {
    value: "payouts",
    question: "When do payouts arrive?",
    answer: "Domestic payouts settle within one business day. International payouts take two to three, and you can track each one by its transfer ID.",
  },
  {
    value: "fees",
    question: "What does a transfer cost?",
    answer: "Domestic transfers are free. International transfers cost 0.5%, capped at $25.00. Currency conversion is billed at the mid-market rate.",
  },
  {
    value: "security",
    question: "How is my money protected?",
    answer: "Customer funds are held in segregated accounts at partner banks. Every login requires two-step verification, and large transfers need a second approver.",
  },
  {
    value: "limits",
    question: "What are the sending limits?",
    answer: "Each wallet sends up to $50,000 a day and $250,000 a month. Verified businesses can raise both from the settings page.",
  },
  {
    value: "refunds",
    question: "Can I cancel a transfer?",
    answer: "Yes, until it leaves Pending. Once a transfer is Settled, ask the recipient for a refund or contact support.",
  },
  {
    value: "support",
    question: "How do I reach support?",
    answer: "Chat is open on weekdays from 8am to 8pm Eastern. Email replies arrive within four hours.",
  },
]

export function Faq({ heading = "Questions", items = questions, defaultValue = items.slice(0, 1).map(q => q.value) }: FaqProps) {
  return (
    <Container render={<section />} size="sm" className="py-16 md:py-24">
      <Stack gap="lg">
        <Heading level={2} size="lg">
          {heading}
        </Heading>
        <Accordion defaultValue={defaultValue}>
          {items.map(q => (
            <AccordionItem key={q.value} value={q.value}>
              <AccordionTrigger>{q.question}</AccordionTrigger>
              <AccordionContent>{q.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Stack>
    </Container>
  )
}

export type { FaqItem, FaqProps }
