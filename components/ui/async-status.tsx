"use client"

import type { ComponentProps } from "react"
import { AnimatePresence, motion, useReducedMotion, type Variants } from "motion/react"
import { Spinner } from "@/components/ui/button"
import { easing, spring } from "@/lib/motion"
import { cn } from "@/lib/utils"

type AsyncState = "idle" | "pending" | "success" | "error"

type AsyncStatusProps = Omit<ComponentProps<"span">, "children"> & {
  state: AsyncState
  /** Text per state; the defaults read "" (idle), "Saving", "Saved" and "Failed". */
  labels?: Partial<Record<AsyncState, string>>
}

const defaults: Record<AsyncState, string> = { idle: "", pending: "Saving", success: "Saved", error: "Failed" }

// The icon is three layers that crossfade on the moderate tier; the mark draws as its layer arrives.
const layer = [
  "col-start-1 row-start-1 flex opacity-0 transition-opacity duration-(--duration-moderate-exit) ease-exit",
  "data-on:opacity-100 data-on:duration-(--duration-moderate) data-on:ease-enter",
].join(" ")
const draw = [
  "[stroke-dasharray:1] [stroke-dashoffset:1] transition-[stroke-dashoffset] duration-(--duration-moderate-exit) ease-exit motion-reduce:transition-none",
  "group-data-on/layer:[stroke-dashoffset:0] group-data-on/layer:duration-(--duration-moderate) group-data-on/layer:ease-spring-moderate",
].join(" ")
const mark = { pathLength: 1, stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round" } as const

const fade = { duration: spring.moderate.duration, ease: easing.enter }
const exit = { ...spring.moderate.exit, ease: easing.exit }
// The old label slides a line up and out while the new one rises into its place. It fades on the fast exit so it is
// gone before the new label is halfway up, and the two never overprint.
const roll: Variants = {
  enter: { y: "100%", opacity: 0 },
  center: { y: 0, opacity: 1 },
  exit: { y: "-100%", opacity: 0, transition: { ...exit, opacity: { ...spring.fast.exit, ease: easing.exit } } },
}
const crossfade: Variants = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 0, transition: exit },
}

/**
 * Status of background work: saving, saved or failed. Pending shows Fine's spinner; success swaps it for a check
 * that draws, error for a danger X, with the layers crossfading on the moderate tier (the stroke draws on
 * moderate too). The label rolls a line up to the new text on spring.moderate, the way AnimatedNumber's digits do,
 * and exits on its tween. The first render does not animate. Reduced motion drops the roll and the draw: label and
 * icon crossfade. The live region holds the new text on the same frame as the state; the rolling copy is aria-hidden.
 * Idea from Rare UI's Inline AI Status, rareui.com.
 */
function AsyncStatus({ state, labels, className, ...props }: AsyncStatusProps) {
  const reduce = useReducedMotion()
  const text = labels?.[state] ?? defaults[state]
  const on = (s: AsyncState) => (state === s ? "" : undefined)

  return (
    <span role="status" aria-live="polite" className={cn("inline-flex items-center gap-1.5 text-sm text-muted-foreground", className)} {...props}>
      <span className="sr-only">{text}</span>
      <span aria-hidden className="grid size-4 place-items-center">
        <span data-on={on("pending")} className={cn(layer, "[&:not([data-on])_path]:[animation-play-state:paused]")}>
          <Spinner className="size-4" />
        </span>
        <span data-on={on("success")} className={cn("group/layer", layer)}>
          <svg viewBox="0 0 16 16" fill="none" className="size-4">
            <path d="M3 8.5 6.5 12 13 4.5" className={draw} {...mark} />
          </svg>
        </span>
        <span data-on={on("error")} className={cn("group/layer text-danger-subtle-foreground", layer)}>
          <svg viewBox="0 0 16 16" fill="none" className="size-4">
            <path d="M4 4l8 8" className={draw} {...mark} />
            <path d="M12 4l-8 8" className={draw} {...mark} />
          </svg>
        </span>
      </span>
      <span aria-hidden className="relative inline-grid overflow-y-clip">
        <AnimatePresence initial={false} mode="popLayout">
          {text && (
            <motion.span
              key={text}
              data-label=""
              className={cn("col-start-1 row-start-1 whitespace-nowrap", state === "error" && "text-danger-subtle-foreground")}
              variants={reduce ? crossfade : roll}
              initial="enter"
              animate="center"
              exit="exit"
              transition={reduce ? fade : { ...spring.moderate, opacity: fade }}
            >
              {text}
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </span>
  )
}

export { AsyncStatus }
export type { AsyncState, AsyncStatusProps }
