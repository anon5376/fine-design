"use client"

import { Children, createContext, isValidElement, useContext, useEffect, useMemo, useState, type ComponentProps, type ReactNode } from "react"
import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react"
import { Checkbox } from "@/components/ui/checkbox"
import { spring } from "@/lib/motion"
import { cn } from "@/lib/utils"

type ChecklistProps = ComponentProps<"ul"> & {
  /** Completed items glide to the end of the list after the strike, in the order they were completed. */
  moveCompletedToEnd?: boolean
}

type ChecklistItemProps = Omit<ComponentProps<"li">, "onChange"> & {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

// What the items need from their list: whether to glide, and the order, whose change re-renders them so each measures its move.
const Order = createContext({ glide: false, order: "" })

// The check draws first (fast), then the strike (moderate); the item leaves once the strike is done.
const strikeMs = Math.round((spring.fast.duration + spring.moderate.duration) * 1000)

const keyOf = (child: ReactNode) => (isValidElement(child) ? String(child.key) : "")

/**
 * A todo or setup list built on Checkbox. Checking an item draws a strike line across its label left to right on the
 * moderate tier, after the check mark, and mutes the label; unchecking retracts it on the moderate exit. With
 * `moveCompletedToEnd` the item then glides to the end of the list (layout, spring.moderate); the DOM is reordered, so
 * reading order follows what is seen, and the browser keeps focus on the item that moved. Reduced motion keeps the colour fade
 * and drops the draw and the glide: the strike appears and the item jumps. Idea from Rare UI's Task List, rareui.com.
 */
function Checklist({ moveCompletedToEnd = false, className, children, ...props }: ChecklistProps) {
  const reduce = useReducedMotion()
  const items = Children.toArray(children)
  const checked = items.flatMap(c => (isValidElement<ChecklistItemProps>(c) && c.props.checked ? [keyOf(c)] : []))
  // Keys of the items already moved to the end, in the order they got there. Those checked on mount start there.
  const [placed, setPlaced] = useState(checked)
  const signature = checked.join("\n")

  useEffect(() => {
    if (!moveCompletedToEnd) return
    const now = new Set(checked)
    setPlaced(p => (p.every(k => now.has(k)) ? p : p.filter(k => now.has(k))))
    const timers = checked
      .filter(k => !placed.includes(k))
      .map(k => setTimeout(() => setPlaced(p => (p.includes(k) ? p : [...p, k])), reduce ? 0 : strikeMs))
    return () => timers.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `checked` and `placed` are read through `signature`
  }, [signature, moveCompletedToEnd, reduce])

  // Items still on their way keep their place; the placed ones follow, oldest first.
  const tail = moveCompletedToEnd ? placed.filter(k => checked.includes(k)) : []
  const sorted = [...items.filter(c => !tail.includes(keyOf(c))), ...tail.flatMap(k => items.filter(c => keyOf(c) === k))]
  const order = sorted.map(keyOf).join("\n")
  const value = useMemo(() => ({ glide: moveCompletedToEnd, order }), [moveCompletedToEnd, order])

  return (
    <ul className={cn("grid gap-2", className)} {...props}>
      <Order.Provider value={value}>{sorted}</Order.Provider>
    </ul>
  )
}

const strike = cn(
  "bg-[linear-gradient(currentColor,currentColor)] bg-no-repeat [background-position:0_58%] [background-size:0%_var(--border-width)]",
  "transition-colors duration-(--duration-moderate-exit) ease-exit motion-safe:transition-[color,background-size]",
  "group-data-checked/item:text-muted-foreground group-data-checked/item:[background-size:100%_var(--border-width)]",
  "group-data-checked/item:duration-(--duration-moderate) group-data-checked/item:ease-spring-moderate motion-safe:group-data-checked/item:delay-(--duration-fast)",
)

function ChecklistItem({ checked, onCheckedChange, className, children, ...props }: ChecklistItemProps) {
  const { glide } = useContext(Order)
  const reduce = useReducedMotion()
  return (
    <motion.li
      layout={glide && !reduce ? "position" : false}
      transition={{ layout: spring.moderate }}
      data-checklist-item=""
      data-checked={checked ? "" : undefined}
      className={cn("group/item text-sm text-foreground", className)}
      {...(props as HTMLMotionProps<"li">)}
    >
      <label className="flex w-fit cursor-pointer items-start gap-2">
        <Checkbox checked={checked} onCheckedChange={onCheckedChange} className="mt-0.5" />
        <span className="min-w-0">
          {/* Inline, so the strike follows the text across wrapped lines. */}
          <span data-strike="" className={strike}>
            {children}
          </span>
        </span>
      </label>
    </motion.li>
  )
}

export { Checklist, ChecklistItem }
export type { ChecklistItemProps, ChecklistProps }
