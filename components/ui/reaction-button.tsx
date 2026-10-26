"use client"

import { useState, type ComponentProps, type ReactNode } from "react"
import { useAnimate, useReducedMotion } from "motion/react"
import { Heart } from "lucide-react"
import { AnimatedNumber } from "@/components/ui/animated-number"
import { Button } from "@/components/ui/button"
import { spring } from "@/lib/motion"
import { cn } from "@/lib/utils"

type ReactionButtonProps = Omit<ComponentProps<typeof Button>, "children" | "aria-pressed" | "aria-label"> & {
  /** What is being reacted with, as in "Like": the accessible name is "Like, 12". */
  label: string
  /** The count when not pressed; pressing adds one. */
  count: number
  /** Icon to fill; defaults to a heart. */
  icon?: ReactNode
  defaultPressed?: boolean
  onPressedChange?: (pressed: boolean) => void
}

/**
 * A like, star or bookmark toggle with a count. Pressing fills the icon (a color fade on the fast tier) while it
 * settles from 0.85 back to 1 on spring.fast, and the count rolls through AnimatedNumber on the moderate tier.
 * Reduced motion drops the scale and keeps the fill and count fades. The accessible name changes with the count on
 * the same frame ("Like, 12" to "Like, 13", grouped like the figure so the visible text is in the name); aria-pressed carries the state.
 */
function ReactionButton({ label, count, icon = <Heart />, defaultPressed = false, onPressedChange, onClick, className, ...props }: ReactionButtonProps) {
  const [pressed, setPressed] = useState(defaultPressed)
  const reduce = useReducedMotion()
  const [scope, animate] = useAnimate<HTMLSpanElement>()
  const shown = count + (pressed ? 1 : 0)

  return (
    <Button
      variant="outline"
      aria-pressed={pressed}
      aria-label={`${label}, ${shown.toLocaleString("en-US")}`}
      className={cn(
        // The Button's own icon rule transitions stroke-width on the fast tier; the fill rides the same rule.
        "[&_svg:not([data-spinner])]:transition-[stroke-width,fill]",
        pressed ? "[&_svg]:fill-current" : "[&_svg]:fill-transparent",
        className,
      )}
      onClick={e => {
        onClick?.(e)
        if (e.defaultPrevented) return
        setPressed(!pressed)
        onPressedChange?.(!pressed)
        if (!reduce && scope.current) animate(scope.current, { scale: [0.85, 1] }, spring.fast)
      }}
      {...props}
    >
      <span ref={scope} data-reaction-icon="" className="inline-flex">
        {icon}
      </span>
      <AnimatedNumber value={shown} />
    </Button>
  )
}

export { ReactionButton }
export type { ReactionButtonProps }
