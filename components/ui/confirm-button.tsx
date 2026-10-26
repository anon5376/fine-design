"use client"

import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react"
import { motion, useReducedMotion } from "motion/react"
import { Button, type ButtonProps } from "@/components/ui/button"
import { easing, spring } from "@/lib/motion"
import { cn } from "@/lib/utils"

type ConfirmButtonProps = Omit<ButtonProps, "onClick"> & {
  /** Runs on Confirm. While a returned promise is pending the button shows its loading state. */
  onConfirm: () => void | Promise<void>
  /** The question the button turns into. */
  question?: string
  confirmLabel?: string
  cancelLabel?: string
}

// Buttons inside the question follow the trigger's size one step down, so the row keeps a margin around them.
const inner = { sm: "sm", md: "sm", lg: "md" } as const

/**
 * Destructive action without a modal. Clicking the danger button widens it into the question with Cancel and
 * Confirm: the width glides on spring.moderate to the question's natural width and back on the moderate exit (size is
 * the information here, the control becomes the question), while the two faces crossfade, the one leaving on the fast exit so the two labels do not sit on top of each other and the one arriving on the moderate tier.
 * Both faces hug the end edge, so Confirm lands where the trigger was and the question opens toward the start. Focus
 * moves to Cancel when it opens; Cancel and Escape collapse it and return focus to the trigger. Confirm shows the
 * button's `loading` state while `onConfirm` is pending, then collapses. The question is a labelled group, so it is
 * announced when focus enters it, and the face that is not showing is inert. Reduced motion drops the width glide
 * (it jumps) and keeps the fades.
 * Idea from Rare UI's Delete Button, rareui.com.
 */
function ConfirmButton({
  onConfirm,
  question = "Are you sure?",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  size = "md",
  children,
  ...props
}: ConfirmButtonProps) {
  const reduce = useReducedMotion()
  const questionId = useId()
  const [asking, setAsking] = useState(false)
  const [pending, setPending] = useState(false)
  // Clipping hides the question while the width is still growing; at rest the focus rings may overflow.
  const [moving, setMoving] = useState(false)
  const [width, setWidth] = useState<number | null>(null)
  const row = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const cancel = useRef<HTMLButtonElement>(null)
  const returnFocus = useRef(false)

  // The question sits out of flow, so the control's own width is the trigger's until the question opens.
  useLayoutEffect(() => {
    const el = row.current
    if (!el) return
    const measure = () => setWidth(el.offsetWidth)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [question, confirmLabel, cancelLabel, size])

  useEffect(() => {
    if (asking) cancel.current?.focus()
    else if (returnFocus.current) trigger.current?.focus()
    returnFocus.current = false
  }, [asking])

  function close() {
    returnFocus.current = true
    setAsking(false)
  }

  async function confirm() {
    setPending(true)
    try {
      await onConfirm()
      close()
    } finally {
      setPending(false)
    }
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key !== "Escape" || pending) return
    e.stopPropagation()
    close()
  }

  const enter = reduce ? { duration: 0 } : spring.moderate
  const leave = reduce ? { duration: 0 } : { ...spring.moderate.exit, ease: easing.exit }

  return (
    <motion.span
      data-confirm-button=""
      className={cn("relative inline-flex justify-end align-middle rounded-control", moving && "overflow-clip")}
      initial={false}
      animate={{ width: asking && width ? width : "auto", transition: asking ? enter : leave }}
      onAnimationStart={() => setMoving(true)}
      onAnimationComplete={() => setMoving(false)}
    >
      <Button
        ref={trigger}
        variant={variant}
        size={size}
        inert={asking}
        onClick={() => setAsking(true)}
        {...props}
        className={cn(
          "transition-opacity",
          asking ? "opacity-0 duration-(--duration-fast-exit) ease-exit" : "duration-(--duration-moderate) ease-enter",
          props.className,
        )}
      >
        {children}
      </Button>
      <div
        ref={row}
        role="group"
        aria-labelledby={questionId}
        inert={!asking}
        onKeyDown={onKeyDown}
        className={cn(
          "absolute inset-y-0 end-0 flex w-max items-center gap-2 rounded-control bg-danger-subtle p-0.5 pl-pad-control-md text-sm text-danger-subtle-foreground transition-opacity",
          asking ? "duration-(--duration-moderate) ease-enter" : "opacity-0 duration-(--duration-fast-exit) ease-exit",
        )}
      >
        <span id={questionId} className="font-label whitespace-nowrap">
          {question}
        </span>
        <Button ref={cancel} variant="outline" size={inner[size ?? "md"]} className="h-full" disabled={pending} onClick={close}>
          {cancelLabel}
        </Button>
        <Button variant="danger" size={inner[size ?? "md"]} className="h-full" loading={pending} onClick={confirm}>
          {confirmLabel}
        </Button>
      </div>
    </motion.span>
  )
}

export { ConfirmButton }
export type { ConfirmButtonProps }
