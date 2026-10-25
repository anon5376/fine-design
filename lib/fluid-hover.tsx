"use client"

import { useCallback, useRef, useState, type FocusEvent, type PointerEvent } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { easing, spring } from "@/lib/motion"
import { cn } from "@/lib/utils"

type Rect = { x: number; y: number; width: number; height: number }
/** `session` steps on each pointer entry; the highlight re-keys on it (see FluidHighlight). */
type Placement = Rect & { session: number }

/**
 * Fluid Functionalism's hover highlight (MIT): one highlight per list glides to the
 * hovered or focused item instead of each item lighting up on its own. Put `ref` and `handlers`
 * on a `relative` container, render <FluidHighlight rect={rect} /> first inside it,
 * and mark each item with `data-fluid-item`. A list that keeps focus elsewhere (Combobox)
 * drives the highlight with `show` and `hide`.
 */
export function useFluidHover<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [rect, setRect] = useState<Placement | null>(null)
  // Fluid's pointer session: a pointer entering the list starts one on its first change of row,
  // so the highlight fades in there instead of sliding from a keyboard-lit or fading row.
  const session = useRef(0)
  const pending = useRef(false)
  const lit = useRef<HTMLElement | null>(null)

  const moveTo = useCallback((target: EventTarget, pointer = false) => {
    const container = ref.current
    const item = (target as Element).closest?.<HTMLElement>("[data-fluid-item]")
    if (!container || !item || !container.contains(item)) return
    if (pointer && pending.current && item !== lit.current) {
      pending.current = false
      session.current += 1
    }
    lit.current = item
    // Layout offsets, not getBoundingClientRect: a popup is still scaling in when the first focus lands.
    let x = 0
    let y = 0
    for (let el: HTMLElement | null = item; el && el !== container; el = el.offsetParent as HTMLElement | null) {
      x += el.offsetLeft
      y += el.offsetTop
    }
    setRect({ x, y, width: item.offsetWidth, height: item.offsetHeight, session: session.current })
  }, [])

  const hide = useCallback(() => {
    lit.current = null
    setRect(null)
  }, [])

  const onPointerEnter = useCallback((e: PointerEvent<T>) => {
    if (e.pointerType !== "touch") pending.current = true
  }, [])
  const onPointerMove = useCallback((e: PointerEvent<T>) => e.pointerType !== "touch" && moveTo(e.target, true), [moveTo])
  // Menus and selects move focus with the arrow keys; the highlight follows it.
  const onFocus = useCallback((e: FocusEvent<T>) => moveTo(e.target), [moveTo])
  const onBlur = useCallback((e: FocusEvent<T>) => {
    if (!ref.current?.contains(e.relatedTarget as Node | null)) hide()
  }, [hide])

  return { ref, rect, show: moveTo, hide, handlers: { onPointerEnter, onPointerMove, onPointerLeave: hide, onFocus, onBlur } }
}

/** Travels on spring.fast; fades over the same 80ms on the token curves. Reduced motion keeps the fade and drops the travel. */
export function FluidHighlight({ rect, className }: { rect: Placement | null; className?: string }) {
  const reduce = useReducedMotion()
  const fade = { duration: spring.fast.duration, ease: easing.enter }
  return (
    <AnimatePresence>
      {rect && (
        <motion.span
          key={rect.session}
          aria-hidden
          className={cn("pointer-events-none absolute top-0 left-0 rounded-control bg-hover", className)}
          initial={{ opacity: 0, x: rect.x, y: rect.y, width: rect.width, height: rect.height }}
          animate={{ opacity: 1, x: rect.x, y: rect.y, width: rect.width, height: rect.height }}
          exit={{ opacity: 0, transition: { ...spring.fast.exit, ease: easing.exit } }}
          transition={reduce ? { duration: 0, opacity: fade } : { ...spring.fast, opacity: fade }}
        />
      )}
    </AnimatePresence>
  )
}
