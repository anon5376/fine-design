"use client"

import { createContext, useContext, useEffect, useRef, type ComponentProps, type MouseEvent } from "react"
import { AnimatePresence, motion, useIsPresent, useReducedMotion, type HTMLMotionProps } from "motion/react"
import { X } from "lucide-react"
import { easing, spring } from "@/lib/motion"
import { cn } from "@/lib/utils"

type TagProps = ComponentProps<"span"> & {
  /** Shows a remove button. */
  onRemove?: () => void
  /** Accessible name of the remove button. Defaults to "Remove <children>" for string children. */
  removeLabel?: string
}

const InList = createContext(false)

/** The remove button of the nearest tag before or after `from` that is still present. */
function neighbour(from: Element, dir: "nextElementSibling" | "previousElementSibling") {
  for (let el = from[dir]; el; el = el[dir]) {
    const button = el.querySelector<HTMLElement>("[data-tag-remove]")
    if (button && !el.hasAttribute("inert")) return button
  }
  return null
}

/**
 * A chip for a chosen value or filter. Static on its own. Inside a TagList a removed tag leaves on
 * the fast tier's exit (opacity and scale, then inert), and focus moves to the next tag's remove
 * button, else the previous one's. Reduced motion keeps the fade and drops the scale.
 */
function Tag({ className, children, onRemove, removeLabel, ...props }: TagProps) {
  const inList = useContext(InList)
  const present = useIsPresent()
  const reduce = useReducedMotion()
  const removed = useRef<{ tag: Element; focused: boolean } | null>(null)

  // The tag stays mounted while it exits; hand the focus it held to a neighbour, not to the page.
  useEffect(() => {
    const was = removed.current
    if (present || !was?.focused) return
    ;(neighbour(was.tag, "nextElementSibling") ?? neighbour(was.tag, "previousElementSibling"))?.focus()
  }, [present])

  function remove(e: MouseEvent<HTMLButtonElement>) {
    removed.current = { tag: e.currentTarget.closest("[data-tag]")!, focused: document.activeElement === e.currentTarget }
    onRemove?.()
  }

  const motionProps: HTMLMotionProps<"span"> = inList
    ? {
        layout: reduce ? false : "position",
        transition: { layout: spring.moderate },
        exit: { opacity: 0, scale: reduce ? 1 : 0.5, transition: { ...spring.fast.exit, ease: easing.exit } },
      }
    : {}

  return (
    <motion.span
      data-tag=""
      inert={!present}
      className={cn(
        "inline-flex h-6 shrink-0 items-center gap-1 whitespace-nowrap rounded-control border-line border-border bg-surface pl-2 text-xs font-label text-foreground",
        onRemove ? "pr-0.5" : "pr-2",
        className,
      )}
      {...motionProps}
      {...(props as HTMLMotionProps<"span">)}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          data-tag-remove=""
          onClick={remove}
          aria-label={removeLabel ?? (typeof children === "string" ? `Remove ${children}` : "Remove")}
          className="inline-flex size-5 cursor-pointer items-center justify-center rounded-small text-muted-foreground outline-none transition-colors duration-(--duration-fast) hover:bg-hover hover:text-foreground focus-visible:focus-ring focus-visible:outline-offset-0"
        >
          <X className="size-3" strokeWidth={2} aria-hidden />
        </button>
      )}
    </motion.span>
  )
}

/**
 * The wrapper for removable tags. Removing one lets its siblings glide into the freed space on
 * spring.moderate (position only) while it fades out. The removal callback still fires at once.
 */
function TagList({ className, children, ...props }: ComponentProps<"div">) {
  return (
    <div className={cn("relative flex flex-wrap gap-2", className)} {...props}>
      <InList.Provider value>
        <AnimatePresence initial={false} mode="popLayout">
          {children}
        </AnimatePresence>
      </InList.Provider>
    </div>
  )
}

export { Tag, TagList }
export type { TagProps }
