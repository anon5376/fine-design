import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const questions = [
  { value: "settlement", question: "How long do transfers take?", answer: "Domestic transfers settle within one business day. International transfers take two to three." },
  { value: "limits", question: "What are the daily limits?", answer: "Each wallet sends up to $50,000 a day. Contact support to raise it." },
  { value: "fees", question: "What does a transfer cost?", answer: "Domestic transfers are free. International transfers cost 0.5%, capped at $25.00." },
]

export function Single() {
  return (
    <Accordion className="w-full max-w-md">
      {questions.map(q => (
        <AccordionItem key={q.value} value={q.value}>
          <AccordionTrigger>{q.question}</AccordionTrigger>
          <AccordionContent>{q.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}

export function Multiple() {
  return (
    <Accordion multiple defaultValue={["settlement", "fees"]} className="w-full max-w-md">
      {questions.map(q => (
        <AccordionItem key={q.value} value={q.value}>
          <AccordionTrigger>{q.question}</AccordionTrigger>
          <AccordionContent>{q.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}

export function DefaultOpen() {
  return (
    <Accordion defaultValue={["limits"]} className="w-full max-w-md">
      {questions.map(q => (
        <AccordionItem key={q.value} value={q.value}>
          <AccordionTrigger>{q.question}</AccordionTrigger>
          <AccordionContent>{q.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}

export function DisabledItem() {
  return (
    <Accordion className="w-full max-w-md">
      <AccordionItem value="settlement">
        <AccordionTrigger>How long do transfers take?</AccordionTrigger>
        <AccordionContent>Domestic transfers settle within one business day. International transfers take two to three.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="limits" disabled>
        <AccordionTrigger>What are the daily limits?</AccordionTrigger>
        <AccordionContent>Each wallet sends up to $50,000 a day.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="fees">
        <AccordionTrigger>What does a transfer cost?</AccordionTrigger>
        <AccordionContent>Domestic transfers are free. International transfers cost 0.5%, capped at $25.00.</AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
