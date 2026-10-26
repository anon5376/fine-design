"use client"

import { useEffect, useRef, useState, type CSSProperties, type SyntheticEvent } from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { AnimatePresence, motion, useAnimate, useReducedMotion, type Variants } from "motion/react"
import type { InputProps } from "@/components/ui/input"
import { easing, spring } from "@/lib/motion"
import { cn } from "@/lib/utils"

type OtpInputProps = Omit<InputProps, "value" | "defaultValue" | "onChange" | "maxLength" | "size"> & {
  /** Number of slots. */
  length?: number
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  /** Fires once each time the value becomes a different full-length code. */
  onComplete?: (value: string) => void
  /** Shakes the row and turns the slots danger. */
  invalid?: boolean
  /** "success" turns the slot borders success, left to right. */
  state?: "idle" | "success"
}

const exit = { ...spring.moderate.exit, ease: easing.exit }
const fade = { duration: spring.moderate.duration, ease: easing.enter }

// A typed character rolls up into its slot from below and a deleted one rolls out downward.
const roll: Variants = {
  enter: { y: "100%", opacity: 0 },
  center: { y: 0, opacity: 1 },
  exit: { y: "100%", opacity: 0, transition: exit },
}
const still: Variants = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 0, transition: { duration: 0 } },
}

const shake = [0, -6, 5, -3, 0]

// The typed text is invisible and the slots only draw it, so the caret, the selection and every
// keyboard path stay the browser's own.
const slot = [
  "grid h-control-lg w-control-md shrink-0 place-items-center overflow-clip rounded-control border-line border-input bg-surface font-label figures text-lg text-foreground",
  "transition-colors duration-(--duration-fast) data-[state=idle]:group-hover/otp:border-muted-foreground",
  "data-[state=invalid]:border-danger-subtle-foreground data-[state=invalid]:text-danger-subtle-foreground",
  "data-[state=success]:border-success-subtle-foreground data-[state=success]:delay-(--stagger)",
].join(" ")

// The active-slot ring is one element that slides between slots (a translate by whole slot pitches), so it
// glides on the moderate spring while its fade stays on the fast tier. Reduced motion lets it jump.
const caret = [
  "pointer-events-none absolute inset-y-0 left-0 w-control-md rounded-control border-line border-ring focus-ring outline-offset-0 opacity-0 peer-focus-visible:opacity-100",
  "transition-[translate,opacity] [transition-duration:var(--duration-moderate),var(--duration-fast)] [transition-timing-function:var(--ease-spring-moderate),var(--ease-enter)] motion-reduce:transition-[opacity]",
].join(" ")

/**
 * Verification code, 2FA or PIN input. Idea from Rare UI's OTP Input, rareui.com. One real
 * <input autoComplete="one-time-code" inputMode="numeric"> sits over the row and is drawn as slots, so a label,
 * Field, paste, autofill and the keyboard all work on a single control. Digits only; anything else is dropped.
 * A typed digit rolls up into its slot and a deleted one rolls out down (moderate, exit on its tween); the
 * ring glides to the next slot (moderate). `invalid` shakes the row once (slow tier as a tween, x 0, -6, 5, -3, 0)
 * and turns the slots danger; `state="success"` turns the borders success left to right (fast, 40ms apart).
 * Reduced motion drops the shake, the roll and the slide, fades the digit in, and keeps the color changes.
 */
function OtpInput({
  length = 6,
  value,
  defaultValue = "",
  onValueChange,
  onComplete,
  invalid,
  state = "idle",
  className,
  onFocus,
  onSelect,
  ...props
}: OtpInputProps) {
  const reduce = useReducedMotion()
  const [inner, setInner] = useState(defaultValue)
  const current = (value ?? inner).slice(0, length)
  const active = Math.min(current.length, length - 1)

  // Shake when `invalid` turns on, not on first render with it already on.
  const [row, animate] = useAnimate<HTMLDivElement>()
  const was = useRef(invalid)
  useEffect(() => {
    if (invalid && !was.current && !reduce) animate(row.current, { x: shake }, { duration: spring.slow.duration, ease: easing.enter })
    was.current = invalid
  }, [invalid, reduce, animate, row])

  // New text always lands after the last digit: a click or arrow key may not park the caret in the middle.
  function pin(e: SyntheticEvent<HTMLInputElement>) {
    const el = e.currentTarget
    const end = el.value.length
    if (el.selectionStart === el.selectionEnd && el.selectionStart !== end) el.setSelectionRange(end, end)
  }

  return (
    <div
      ref={row}
      data-otp=""
      className={cn("group/otp relative inline-flex gap-2 has-disabled:cursor-not-allowed has-disabled:opacity-50", className)}
    >
      <InputPrimitive
        autoComplete="one-time-code"
        inputMode="numeric"
        spellCheck={false}
        aria-invalid={invalid || undefined}
        {...props}
        value={current}
        onValueChange={raw => {
          const next = raw.replace(/\D/g, "").slice(0, length)
          if (value === undefined) setInner(next)
          if (next === current) return
          onValueChange?.(next)
          if (next.length === length) onComplete?.(next)
        }}
        onFocus={e => {
          pin(e)
          onFocus?.(e)
        }}
        onSelect={e => {
          pin(e)
          onSelect?.(e)
        }}
        className="peer absolute inset-0 z-10 size-full cursor-text bg-transparent text-base opacity-0 caret-transparent outline-none disabled:cursor-not-allowed"
      />
      {Array.from({ length }, (_, i) => (
        <span
          key={i}
          aria-hidden
          data-otp-slot=""
          data-state={invalid ? "invalid" : state}
          style={{ "--stagger": `${i * 40}ms` } as CSSProperties}
          className={slot}
        >
          <AnimatePresence initial={false}>
            {current[i] && (
              <motion.span
                key={current[i]}
                className="col-start-1 row-start-1"
                variants={reduce ? still : roll}
                initial="enter"
                animate="center"
                exit="exit"
                transition={reduce ? fade : { ...spring.moderate, opacity: fade }}
              >
                {current[i]}
              </motion.span>
            )}
          </AnimatePresence>
        </span>
      ))}
      <span
        aria-hidden
        data-otp-caret=""
        data-empty={current.length < length ? "" : undefined}
        style={{ translate: `calc(${active} * (var(--control-md) + 0.5rem)) 0` }}
        className={cn("group/caret grid place-items-center", caret)}
      >
        <span className="h-1/2 w-0.5 rounded-pill bg-foreground opacity-0 transition-opacity duration-(--duration-fast) group-data-empty/caret:opacity-100" />
      </span>
    </div>
  )
}

export { OtpInput }
export type { OtpInputProps }
