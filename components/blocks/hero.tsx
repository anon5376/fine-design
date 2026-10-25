"use client"

import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Heading } from "@/components/ui/heading"
import { Container, Stack } from "@/components/ui/layout"
import { Text } from "@/components/ui/text"
import { spring } from "@/lib/motion"
import { motion, useReducedMotion } from "motion/react"

// Inner width of a slip, between the borders and their one-space padding.
const WIDTH = 32

// Three transfer slips, top to bottom. `indent` is how far the slip is nudged right.
const slips = [
  { indent: 6, id: "tx_8f21", status: "Pending", to: "Northwind Traders", amount: "$12,480.00" },
  { indent: 2, id: "tx_8f20", status: "Settled", to: "Alder & Finch LLP", amount: "$3,920.50" },
  { indent: 9, id: "tx_8f1f", status: "Settled", to: "Kestrel Freight", amount: "$860.00" },
]

type Slip = (typeof slips)[number]

const row = (left: string, right: string) => `| ${left}${right.padStart(WIDTH - left.length)} |`

function slip({ indent, id, status, to, amount }: Slip) {
  const pad = " ".repeat(indent)
  const edge = "-".repeat(WIDTH + 2)
  return [
    `${pad}.${edge}.`,
    pad + row(id, status),
    pad + row(`To ${to}`, ""),
    pad + row("- ".repeat(WIDTH / 2).trimEnd(), ""),
    pad + row("Amount", amount),
    `${pad}'${edge}'`,
  ].join("\n")
}

// Rare UI's expressive spring (visualDuration, bounce) without the exit tween.
const { type, visualDuration, bounce } = spring.expressive

/**
 * Motion: the slips drop onto the stack and settle with one overshoot, bottom slip first, on the expressive
 * tier (the falling-and-settling idea of Rare UI's Gravity Letters, rareui.com; the spring is the token).
 * Slips are visible from the first frame and only travel 20px. Reduced motion: they sit in place.
 * The headline, sentence and actions are static.
 */
function LedgerStack() {
  const reduce = useReducedMotion()
  return (
    <div aria-hidden className="figures hidden shrink-0 select-none self-start overflow-hidden py-6 font-mono text-xs leading-[1.25] whitespace-pre text-muted-foreground sm:block lg:self-center">
      {slips.map((s, i) => (
        <motion.div
          key={i}
          initial={reduce ? false : { y: -20 }}
          animate={{ y: 0 }}
          transition={reduce ? { duration: 0 } : { type, visualDuration, bounce, delay: (slips.length - 1 - i) * 0.08 }}
        >
          {slip(s)}
        </motion.div>
      ))}
    </div>
  )
}

type HeroProps = {
  /** Headline, set as the page's h1. */
  title?: ReactNode
  /** Sentence under the headline. */
  description?: ReactNode
  /** Buttons or links under the description. */
  actions?: ReactNode
  /** Below the text, beside it from lg. Defaults to the transfer slips; null drops it. */
  media?: ReactNode
}

function Hero({
  title = "Every transfer, reconciled",
  description = "Send money, issue invoices and close the month from one account.",
  actions = (
    <>
      <Button size="lg" render={<a href="#" />}>
        Open an account
      </Button>
      <Button size="lg" variant="secondary" render={<a href="#" />}>
        View pricing
      </Button>
    </>
  ),
  media = <LedgerStack />,
}: HeroProps) {
  return (
    <Container render={<section />} className="py-16 md:py-24">
      <Stack gap="2xl" align="center" className="lg:flex-row lg:justify-between">
        <Stack gap="lg" align="start" className="w-full max-w-xl">
          <Heading level={1} size="display" className="text-4xl sm:text-5xl lg:text-6xl">
            {title}
          </Heading>
          <Text size="lg" variant="muted">
            {description}
          </Text>
          {actions && (
            <Stack direction="row" gap="sm" wrap>
              {actions}
            </Stack>
          )}
        </Stack>
        {media}
      </Stack>
    </Container>
  )
}

export { Hero }
export type { HeroProps }
