"use client"

import { Children, createContext, isValidElement, useContext, useId, useState, type ComponentProps, type ReactNode } from "react"
import { motion, useReducedMotion } from "motion/react"
import { spring } from "@/lib/motion"
import { cn } from "@/lib/utils"

type StepperProps = ComponentProps<"ol"> & {
  /** Index of the current step; the steps before it are completed. An index past the last step completes them all. */
  current: number
  orientation?: "horizontal" | "vertical"
}

type StepProps = Omit<ComponentProps<"li">, "title" | "children"> & {
  title: ReactNode
  description?: ReactNode
}

type StepState = { index: number; current: number; last: boolean; vertical: boolean; ringId: string; forward: boolean }

const StepContext = createContext<StepState | null>(null)

/**
 * Multi-step progress for checkout, onboarding or setup. Completing a step turns its marker into a check that draws
 * (fast); the connector to the next step then fills from its start edge (scaleX, or scaleY when vertical; moderate, as
 * size is the information there) and the current-step ring travels to the next marker with it (shared layout,
 * spring.moderate). Going back retracts both without the wait. Nothing animates on first render. Reduced
 * motion keeps the marker fades and makes the draw, fill and ring jump. The current step carries aria-current="step"
 * and completed ones say "completed" to assistive tech. Idea from Rare UI's Step Player, rareui.com.
 */
function Stepper({ current, orientation = "horizontal", className, children, ...props }: StepperProps) {
  const ringId = useId()
  const [seen, setSeen] = useState({ current, forward: true })
  // The direction of the latest change is kept until the next one, so a step going back is not made to wait.
  if (seen.current !== current) setSeen({ current, forward: current > seen.current })
  const vertical = orientation === "vertical"
  const steps = Children.toArray(children)

  return (
    <ol data-orientation={orientation} className={cn("flex", vertical ? "flex-col" : "items-start", className)} {...props}>
      {steps.map((step, index) => (
        <StepContext.Provider
          key={isValidElement(step) ? step.key : index}
          value={{ index, current, last: index === steps.length - 1, vertical, ringId, forward: seen.forward }}
        >
          {step}
        </StepContext.Provider>
      ))}
    </ol>
  )
}

const draw =
  "[stroke-dasharray:1] [stroke-dashoffset:1] transition-[stroke-dashoffset] duration-(--duration-fast-exit) ease-exit motion-reduce:transition-none"

function Marker({ index, status, ringId, forward }: { index: number; status: Status; ringId: string; forward: boolean }) {
  const reduce = useReducedMotion()
  const done = status === "completed"
  return (
    <span
      aria-hidden
      className={cn(
        "relative grid size-6 shrink-0 place-items-center rounded-full border-line text-xs font-label figures transition-colors duration-(--duration-fast)",
        done ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40 bg-surface",
        status === "current" ? "text-foreground" : !done && "text-muted-foreground",
      )}
    >
      <span className={cn("col-start-1 row-start-1 transition-opacity duration-(--duration-fast)", done && "opacity-0")}>{index + 1}</span>
      <svg viewBox="0 0 12 12" fill="none" className="col-start-1 row-start-1 size-3.5">
        <path
          data-step-check=""
          d="M2.5 6.5 5 9l4.5-6"
          pathLength={1}
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn(draw, done && "[stroke-dashoffset:0] duration-(--duration-fast) ease-enter")}
        />
      </svg>
      {status === "current" && (
        <motion.span
          data-step-ring=""
          layoutId={reduce ? undefined : ringId}
          transition={{ layout: { ...spring.moderate, delay: forward ? spring.fast.duration : 0 } }}
          className="absolute -inset-(--border-width) rounded-full border-line border-primary"
        />
      )}
    </span>
  )
}

type Status = "completed" | "current" | "upcoming"

const fill = cn(
  "absolute inset-0 bg-primary transition-transform duration-(--duration-moderate-exit) ease-exit motion-reduce:transition-none",
  "data-filled:duration-(--duration-moderate) data-filled:ease-spring-moderate motion-safe:data-filled:delay-(--duration-fast)",
)

function Step({ title, description, className, ...props }: StepProps) {
  const ctx = useContext(StepContext)
  if (!ctx) throw new Error("Step must be a child of Stepper")
  const { index, current, last, vertical, ringId, forward } = ctx
  const status: Status = index < current ? "completed" : index === current ? "current" : "upcoming"
  const text = (
    <span className={cn("relative grid min-w-0 gap-0.5 pt-0.5", vertical && !last && "pb-6")}>
      <span className={cn("text-sm", status === "upcoming" ? "text-muted-foreground" : "font-label text-foreground", !vertical && "truncate")}>
        {title}
        {status === "completed" && <span className="sr-only"> completed</span>}
      </span>
      {description && <span className="text-xs text-muted-foreground">{description}</span>}
    </span>
  )
  // Upcoming parts take the muted text color at low alpha, not the border token: Poster's border is ink and would outweigh the filled part.
  const connector = !last && (
    <span
      aria-hidden
      className={cn("relative overflow-hidden bg-muted-foreground/40", vertical ? "my-1 min-h-4 w-(--border-width) flex-1" : "mt-[calc(0.75rem-var(--border-width)/2)] h-(--border-width) min-w-2 flex-1")}
    >
      <span
        data-connector-fill=""
        data-filled={status === "completed" ? "" : undefined}
        className={cn(fill, vertical ? "origin-top scale-y-0 data-filled:scale-y-100" : "origin-left scale-x-0 data-filled:scale-x-100 rtl:origin-right")}
      />
    </span>
  )
  const marker = <Marker index={index} status={status} ringId={ringId} forward={forward} />

  return (
    <li
      aria-current={status === "current" ? "step" : undefined}
      data-status={status}
      className={cn("flex", vertical ? "items-stretch gap-3" : cn("min-w-0 items-start gap-2", !last && "flex-auto"), className)}
      {...props}
    >
      {vertical ? (
        <>
          <span className="flex flex-col items-center">
            {marker}
            {connector}
          </span>
          {text}
        </>
      ) : (
        <>
          {marker}
          {text}
          {connector}
        </>
      )}
    </li>
  )
}

export { Step, Stepper }
export type { StepProps, StepperProps }
