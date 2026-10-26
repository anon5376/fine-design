"use client"

import { useLayoutEffect, useRef, type ComponentProps, type Key, type Ref } from "react"
import { AnimatePresence, motion, useIsPresent } from "motion/react"
import { easing, spring } from "@/lib/motion"
import { cn } from "@/lib/utils"

type AutoHeightProps = ComponentProps<"div"> & {
  /** Changes when the content is swapped for other content; the old and new crossfade. */
  transitionKey?: Key
}

const enter = { duration: spring.moderate.duration, ease: easing.enter }
const exit = { ...spring.fast.exit, ease: easing.exit }

/** One view of the content. While it leaves it is inert and out of flow, so the height already follows the new view. */
function Pane({ ref, children }: { ref?: Ref<HTMLDivElement>; children: ComponentProps<"div">["children"] }) {
  const present = useIsPresent()
  return (
    <motion.div ref={ref} inert={!present} initial={{ opacity: 0 }} animate={{ opacity: 1, transition: enter }} exit={{ opacity: 0, transition: exit }}>
      {children}
    </motion.div>
  )
}

/**
 * A container that glides to its content's new height. Height is the information, so it runs on the moderate tier
 * (CSS, `ease-spring-moderate`); the first measure does not animate. Pass `transitionKey` when the content is
 * swapped for other content (a step, a tab): the old view leaves on the fast exit, inert and out of flow, and the
 * new one fades in on the moderate tier. Focus is never moved. Reduced motion makes the height jump and keeps the
 * crossfade. Put padding on the children, not on the container. Idea from Rare UI's Family Drawer, rareui.com.
 */
function AutoHeight({ transitionKey, className, children, ...props }: AutoHeightProps) {
  const outer = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)

  // Set the height straight from the observer, not through state, so it lands on the frame the content changed.
  // Going from auto to the first pixel height does not transition, which keeps page load still.
  useLayoutEffect(() => {
    const box = outer.current
    const content = inner.current
    if (!box || !content) return
    // Border-box size from the observer is layout size, so a scale-in parent (a dialog opening) does not skew it.
    const observer = new ResizeObserver(([entry]) => {
      box.style.height = `${entry.borderBoxSize[0].blockSize}px`
    })
    observer.observe(content)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={outer}
      className={cn("overflow-hidden transition-[height] duration-(--duration-moderate) ease-spring-moderate motion-reduce:transition-none", className)}
      {...props}
    >
      <div ref={inner} className="relative">
        <AnimatePresence initial={false} mode="popLayout">
          <Pane key={transitionKey ?? "content"}>{children}</Pane>
        </AnimatePresence>
      </div>
    </div>
  )
}

export { AutoHeight }
export type { AutoHeightProps }
