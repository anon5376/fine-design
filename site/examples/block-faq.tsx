import { Faq } from "@/components/blocks/faq"

export function ThreeQuestionsOpen() {
  return (
    <Faq
      heading="Billing"
      defaultValue={["invoice", "cancel"]}
      items={[
        { value: "invoice", question: "Where do I find my invoices?", answer: "Under Settings, then Billing. Each invoice is a PDF you can download." },
        { value: "cancel", question: "Can I cancel any time?", answer: "Yes. Your plan stays active until the end of the period you paid for." },
        { value: "tax", question: "Do you charge VAT?", answer: "VAT is added at checkout for customers in the EU, based on your billing address." },
      ]}
    />
  )
}
