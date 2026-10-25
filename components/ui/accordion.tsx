"use client"

import type { ComponentProps, PointerEvent, TransitionEvent } from "react"
import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion"
import { ChevronRight } from "lucide-react"
import { FluidHighlight, useFluidHover } from "@/lib/fluid-hover"
import { cn } from "@/lib/utils"

/**
 * Pass `multiple` to let several items stay open; otherwise opening one closes the others. Motion (Fluid accordion):
 * the panel's height, the chevron and the hover highlight all run on the fast tier, and the body fades slightly ahead of the height.
 */
function Accordion({ className, children, ...props }: ComponentProps<typeof AccordionPrimitive.Root>) {
  const { ref, rect, show, hide, handlers } = useFluidHover<HTMLDivElement>()
  // A disabled item ignores the pointer, so it would leave the previous row lit. Drop the highlight over it.
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if ((e.target as Element).closest("[data-disabled]")) hide()
    else handlers.onPointerMove(e)
  }
  // Rows move while a panel opens or closes; once the height settles, re-aim the highlight at the row under the pointer or focus.
  const onTransitionEnd = (e: TransitionEvent<HTMLDivElement>) => {
    if (e.propertyName !== "height") return
    const row = ref.current?.querySelector<HTMLElement>("[data-fluid-item]:hover, [data-fluid-item]:focus-visible")
    if (row) show(row)
  }
  return (
    <AccordionPrimitive.Root
      ref={ref}
      {...handlers}
      onPointerMove={onPointerMove}
      onTransitionEnd={onTransitionEnd}
      className={cn("relative w-full", className)}
      {...props}
    >
      <FluidHighlight rect={rect} />
      {children}
    </AccordionPrimitive.Root>
  )
}

function AccordionItem({ className, ...props }: ComponentProps<typeof AccordionPrimitive.Item>) {
  return <AccordionPrimitive.Item className={cn("border-b-line border-border", className)} {...props} />
}

function AccordionTrigger({ className, children, ...props }: ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-fluid-item
        className={cn(
          "group relative -mx-2 flex h-control-lg flex-1 cursor-pointer items-center justify-between gap-4 rounded-control px-2 text-left text-sm font-label text-muted-foreground outline-none",
          "transition-[color] duration-(--duration-fast) hover:text-foreground focus-visible:text-foreground focus-visible:focus-ring data-panel-open:text-foreground data-disabled:pointer-events-none data-disabled:opacity-50",
          className,
        )}
        {...props}
      >
        {children}
        <ChevronRight
          aria-hidden
          strokeWidth={1.5}
          className="size-4 shrink-0 transition-[rotate,stroke-width] duration-(--duration-fast) ease-enter group-hover:stroke-2 group-data-panel-open:rotate-90 group-data-panel-open:stroke-2 motion-reduce:transition-none"
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

// Height tweens on --accordion-panel-height. Opening: height on the fast tier, the fade a beat ahead on its exit duration.
// Closing: both on the fast exit. The padding sits on an inner div so the tweened box has none.
const panelMotion = [
  "h-(--accordion-panel-height) overflow-hidden transition-[height,opacity] ease-enter [transition-duration:var(--duration-fast),var(--duration-fast-exit)]",
  "data-starting-style:h-0 data-starting-style:opacity-0 data-ending-style:h-0 data-ending-style:opacity-0",
  "data-ending-style:ease-exit data-ending-style:[transition-duration:var(--duration-fast-exit)] motion-reduce:transition-none",
].join(" ")

function AccordionContent({ className, children, ...props }: ComponentProps<typeof AccordionPrimitive.Panel>) {
  return (
    <AccordionPrimitive.Panel className={panelMotion} {...props}>
      <div className={cn("pb-3 text-sm text-muted-foreground", className)}>{children}</div>
    </AccordionPrimitive.Panel>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
