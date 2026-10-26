"use client"

import { useEffect, useRef } from "react"
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react"
import { Bell } from "lucide-react"
import { AnimatedNumber } from "@/components/ui/animated-number"
import { IconButton, type IconButtonProps } from "@/components/ui/icon-button"
import { easing, spring } from "@/lib/motion"

type NotificationBellProps = Omit<IconButtonProps, "label" | "children"> & {
  /** Unread notifications. A rise swings the bell once; zero hides the badge; the badge reads 99+ above 99. */
  count: number
  /** Accessible name stem; the button reads "Notifications, 3 unread". */
  label?: string
}

const SWING_DEGREES = 12
const MAX_BADGE = 99

/**
 * A bell button with an unread badge. When `count` rises the bell swings once from its top pivot on
 * spring.expressive, the one tier that overshoots, because a notification is feedback arriving: one full
 * back-and-forth driven by a single spring, so the overshoot becomes the last small ring. A rise during a swing
 * carries on with it instead of restarting, and a fall never swings. The badge pops in from scale 0 on the fast
 * tier (and leaves on its exit) and its figure rolls through AnimatedNumber on the moderate tier; nothing moves on
 * first render. Reduced motion drops the swing and the pop and keeps the fades. The name is "Notifications, 3
 * unread" (99+ above 99, as the badge reads) on the frame the count changes, and a polite live region announces the change.
 */
function NotificationBell({ count, label = "Notifications", ...props }: NotificationBellProps) {
  const reduce = useReducedMotion()
  const phase = useMotionValue(0)
  const rotate = useTransform(phase, p => SWING_DEGREES * Math.sin(p * 2 * Math.PI))
  const swinging = useRef(false)
  const previous = useRef(count)

  useEffect(() => {
    const rose = count > previous.current
    previous.current = count
    if (!rose || reduce || swinging.current) return
    swinging.current = true
    phase.set(0)
    animate(phase, 1, spring.expressive).then(() => {
      swinging.current = false
    })
  }, [count, reduce, phase])

  // The name repeats the badge (99+), so the visible text is part of it.
  const shown = count > MAX_BADGE ? `${MAX_BADGE}+` : count
  const unread = count > 0 ? `${label}, ${shown} unread` : `${label}, none unread`

  return (
    <>
      <IconButton label={count > 0 ? unread : label} {...props}>
        <motion.span data-bell="" className="inline-flex origin-[50%_8%]" style={{ rotate }}>
          <Bell />
        </motion.span>
        <AnimatePresence initial={false}>
          {count > 0 && (
            <motion.span
              key="badge"
              data-badge=""
              aria-hidden
              className="figures absolute -top-2 left-1/2 inline-flex h-4 min-w-4 items-center justify-center rounded-pill bg-primary px-1 text-2xs font-strong text-primary-foreground"
              initial={{ opacity: 0, scale: reduce ? 1 : 0 }}
              animate={{ opacity: 1, scale: 1, transition: { ...spring.fast, opacity: { duration: spring.fast.duration, ease: easing.enter } } }}
              exit={{ opacity: 0, scale: reduce ? 1 : 0, transition: { ...spring.fast.exit, ease: easing.exit } }}
            >
              <AnimatedNumber value={Math.min(count, MAX_BADGE)} />
              {count > MAX_BADGE && "+"}
            </motion.span>
          )}
        </AnimatePresence>
      </IconButton>
      <span role="status" aria-live="polite" className="sr-only">
        {unread}
      </span>
    </>
  )
}

export { NotificationBell }
export type { NotificationBellProps }
