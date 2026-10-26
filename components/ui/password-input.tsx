"use client"

import { useEffect, useId, useRef, useState, type CSSProperties } from "react"
import { AnimatePresence, motion, useReducedMotion, type Variants } from "motion/react"
import { Eye, EyeOff } from "lucide-react"
import { IconButton } from "@/components/ui/icon-button"
import { Input, type InputProps } from "@/components/ui/input"
import { easing, spring } from "@/lib/motion"
import { cn } from "@/lib/utils"

type Strength = 0 | 1 | 2 | 3 | 4

type PasswordInputProps = Omit<InputProps, "type"> & {
  /** Shows the strength meter at this level (0 to 4). 0 is an empty meter with no label. */
  strength?: Strength
  /** Scores the typed value (0 to 4) and shows the meter. Ignored when `strength` is set. */
  scorer?: (value: string) => Strength
}

const labels = ["", "Weak", "Fair", "Good", "Strong"]
// The meter takes one status color for its whole fill, so the level reads from color and from the label.
// Level 0 keeps the first color, so a segment that fills from empty fades no color in with it.
const tones = ["[--meter:var(--danger)]", "[--meter:var(--danger)]", "[--meter:var(--warning)]", "[--meter:var(--info)]", "[--meter:var(--success)]"]
const segments = [0, 1, 2, 3]

const swap: Variants = {
  enter: { opacity: 0, scale: 0.5 },
  center: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.5, transition: { ...spring.fast.exit, ease: easing.exit } },
}
const crossfade: Variants = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 0, transition: { ...spring.fast.exit, ease: easing.exit } },
}

// A segment fills from its left edge on the moderate spring, 40ms after the one before it, and empties on the
// moderate exit with no stagger (the timing comes from the state it is going to). A segment that fills from
// empty takes the level's color at once, so no color fades in with it; one that stays filled (data-keep)
// fades to the new color. Reduced motion keeps the fill at full width and fades it in instead: no travel,
// no stagger.
const fill = [
  "block h-full origin-left scale-x-0 rounded-[inherit] bg-(--meter) transition-[scale,background-color] duration-(--duration-moderate-exit) ease-exit",
  "data-on:not-data-keep:transition-[scale] data-on:scale-x-100 data-on:delay-(--stagger) data-on:duration-(--duration-moderate) data-on:ease-spring-moderate",
  "motion-reduce:scale-x-100 motion-reduce:opacity-0 motion-reduce:transition-[opacity,background-color] motion-reduce:data-on:opacity-100 motion-reduce:data-on:delay-0 motion-reduce:data-on:not-data-keep:transition-[opacity]",
].join(" ")

/**
 * Password field with a show and hide toggle and an optional strength meter. Idea from Rare UI's Password
 * Input, rareui.com. Pass `strength` (0 to 4) or a `scorer` to show the meter; the label under it is a polite
 * live region the input points to through aria-describedby, next to any FieldDescription.
 * The eye swaps with its slashed twin on the fast tier (scale 0.5 and fade). Meter segments fill left to right
 * on the moderate tier, 40ms apart, and fade to the level's status color. Reduced motion drops the scale and the
 * fill travel and keeps the fades. The toggle's name changes on the frame the type does.
 */
function PasswordInput({ strength, scorer, className, size, onValueChange, disabled, "aria-describedby": describedBy, ...props }: PasswordInputProps) {
  const reduce = useReducedMotion()
  const statusId = useId()
  const [shown, setShown] = useState(false)
  const [typed, setTyped] = useState(String(props.defaultValue ?? ""))

  const text = String(props.value ?? typed)
  const meter = strength !== undefined || scorer !== undefined
  const level = strength ?? scorer?.(text) ?? 0
  const before = useRef(level)
  useEffect(() => {
    before.current = level
  })

  return (
    <div className="grid w-full gap-2">
      <div className="relative">
        <Input
          type={shown ? "text" : "password"}
          size={size}
          disabled={disabled}
          aria-describedby={[describedBy, meter ? statusId : undefined].filter(Boolean).join(" ") || undefined}
          onValueChange={(value, details) => {
            setTyped(value)
            onValueChange?.(value, details)
          }}
          className={cn("pr-[calc(var(--control-sm)+0.25rem)]", className)}
          {...props}
        />
        <IconButton
          label={shown ? "Hide password" : "Show password"}
          aria-pressed={shown}
          disabled={disabled}
          className="absolute inset-y-1 right-1 h-auto w-auto aspect-square"
          onClick={() => setShown(!shown)}
        >
          <span className="inline-grid">
            <AnimatePresence initial={false}>
              <motion.span
                key={shown ? "hide" : "show"}
                data-eye={shown ? "closed" : "open"}
                className="col-start-1 row-start-1 flex"
                variants={reduce ? crossfade : swap}
                initial="enter"
                animate="center"
                exit="exit"
                transition={reduce ? { duration: spring.fast.duration, ease: easing.enter } : spring.fast}
              >
                {shown ? <EyeOff /> : <Eye />}
              </motion.span>
            </AnimatePresence>
          </span>
        </IconButton>
      </div>
      {meter && (
        <div className={cn("grid gap-1.5", tones[level])}>
          <div aria-hidden data-strength-meter="" className="grid grid-cols-4 gap-1">
            {segments.map(i => (
              <span key={i} className="h-1 overflow-hidden rounded-pill bg-secondary">
                <span
                  data-fill=""
                  data-on={i < level ? "" : undefined}
                  data-keep={i < Math.min(before.current, level) ? "" : undefined}
                  style={{ "--stagger": `${i * 40}ms` } as CSSProperties}
                  className={fill}
                />
              </span>
            ))}
          </div>
          <p id={statusId} aria-live="polite" className="min-h-lh text-xs text-muted-foreground">
            {labels[level]}
          </p>
        </div>
      )}
    </div>
  )
}

export { PasswordInput }
export type { PasswordInputProps, Strength }
