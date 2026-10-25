"use client"

import { useMemo, useState, type ComponentProps } from "react"
import { AnimatePresence, motion, useReducedMotion, type Variants } from "motion/react"
import { easing, spring } from "@/lib/motion"
import { cn } from "@/lib/utils"

type Part = { key: string; type: string; value: string }

/** Keys a formatted part by its place, so a digit keeps its identity while the digits around it come and go. */
function partsOf(formatter: Intl.NumberFormat, value: number): Part[] {
  const parts = formatter.formatToParts(value)
  const total = parts.reduce((n, p) => n + (p.type === "integer" ? p.value.length : 0), 0)
  const seen: Record<string, number> = {}
  let left = 0
  let fraction = 0
  return parts.flatMap<Part>(({ type, value }) => {
    if (type === "integer") {
      return [...value].map(char => ({ key: `i${total - 1 - left++}`, type, value: char }))
    }
    if (type === "fraction") {
      return [...value].map(char => ({ key: `f${fraction++}`, type, value: char }))
    }
    if (type === "group") return [{ key: `g${total - left}`, type, value }]
    seen[type] = (seen[type] ?? 0) + 1
    return [{ key: `${type}${seen[type]}`, type, value }]
  })
}

const exit = { ...spring.moderate.exit, ease: easing.exit }
const fade = { duration: spring.moderate.duration, ease: easing.enter }

// A glyph slides a full line out and the next one in from the other side, in the direction the value moved.
const roll: Variants = {
  enter: (trend: number) => ({ y: `${trend * 100}%`, opacity: 0 }),
  center: { y: 0, opacity: 1 },
  exit: (trend: number) => ({ y: `${trend * -100}%`, opacity: 0, transition: exit }),
}
const still: Variants = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 0, transition: { duration: 0 } },
}

const grow: Variants = {
  enter: { opacity: 0, width: 0 },
  center: { opacity: 1, width: "auto" },
  exit: { opacity: 0, width: 0, transition: exit },
}

type AnimatedNumberProps = Omit<ComponentProps<"span">, "children"> & {
  value: number
  /** Intl.NumberFormat options, for currency, percent, decimals and so on. */
  format?: Intl.NumberFormatOptions
  /** BCP 47 tag. Defaults to en-US so the server and the browser render the same text. */
  locale?: string
}

/**
 * A figure whose changed digits roll. Each one slides a line up when the value rose and down when it fell, on
 * spring.moderate (exit on its tween); digits that did not change stay put, and added or removed digits and
 * separators grow and shrink in width on the same tier, the one place size is the information. The first render
 * and an unchanged value do not animate. Reduced motion drops the travel and the width, and fades the new glyph in.
 * Assistive tech reads the formatted final value from a hidden copy straight away; the rolling glyphs are aria-hidden.
 */
function AnimatedNumber({ value, format, locale = "en-US", className, ...props }: AnimatedNumberProps) {
  const reduce = useReducedMotion()
  const options = JSON.stringify(format)
  const formatter = useMemo(() => new Intl.NumberFormat(locale, options ? JSON.parse(options) : undefined), [locale, options])
  const [last, setLast] = useState({ value, trend: 1 })
  // The direction follows the sign of the latest change and is kept until the next one.
  if (last.value !== value) setLast({ value, trend: value < last.value ? -1 : 1 })
  const { trend } = last

  return (
    <span className={cn("figures relative inline-flex whitespace-pre", className)} {...props}>
      <span className="sr-only">{formatter.format(value)}</span>
      <span aria-hidden className="inline-flex">
        <AnimatePresence initial={false} custom={trend}>
          {partsOf(formatter, value).map(part => (
            <motion.span
              key={part.key}
              className="inline-grid overflow-clip"
              variants={reduce ? still : grow}
              initial="enter"
              animate="center"
              exit="exit"
              transition={reduce ? fade : { ...spring.moderate, opacity: fade }}
            >
              <AnimatePresence initial={false} custom={trend}>
                <motion.span
                  key={part.value}
                  className="col-start-1 row-start-1"
                  custom={trend}
                  variants={reduce ? still : roll}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={reduce ? fade : { ...spring.moderate, opacity: fade }}
                >
                  {part.value}
                </motion.span>
              </AnimatePresence>
            </motion.span>
          ))}
        </AnimatePresence>
      </span>
    </span>
  )
}

export { AnimatedNumber }
export type { AnimatedNumberProps }
