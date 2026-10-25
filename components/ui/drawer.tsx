"use client"

import { createContext, useContext, type ComponentProps } from "react"
import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer"
import { X } from "lucide-react"
import { backdropClass } from "@/components/ui/dialog"
import { IconButton } from "@/components/ui/icon-button"
import { cn } from "@/lib/utils"

type Side = "right" | "left" | "bottom"
const SideContext = createContext<Side>("right")
const swipe = { right: "right", left: "left", bottom: "down" } as const

type DrawerProps = ComponentProps<typeof DrawerPrimitive.Root> & {
  /** Edge the sheet slides from; it also swipes back out that way. */
  side?: Side
}

function Drawer({ side = "right", ...props }: DrawerProps) {
  return (
    <SideContext value={side}>
      <DrawerPrimitive.Root swipeDirection={swipe[side]} {...props} />
    </SideContext>
  )
}

const DrawerTrigger = DrawerPrimitive.Trigger
const DrawerClose = DrawerPrimitive.Close

// Slide uses `transform`, not `translate`: while swiping, Base UI writes an inline transform that overrides this one,
// so the sheet tracks the finger 1:1. A `translate` here would stack on that transform and double the movement.
const sideClass: Record<Side, string> = {
  right:
    "inset-y-0 right-0 h-dvh w-[min(24rem,calc(100vw-2rem))] border-l-line [transform:translateX(var(--drawer-swipe-movement-x,0px))] data-starting-style:[transform:translateX(100%)] data-ending-style:[transform:translateX(100%)]",
  left: "inset-y-0 left-0 h-dvh w-[min(24rem,calc(100vw-2rem))] border-r-line [transform:translateX(var(--drawer-swipe-movement-x,0px))] data-starting-style:[transform:translateX(-100%)] data-ending-style:[transform:translateX(-100%)]",
  bottom:
    "inset-x-0 bottom-0 max-h-[85dvh] rounded-t-container border-t-line [transform:translateY(var(--drawer-swipe-movement-y,0px))] data-starting-style:[transform:translateY(100%)] data-ending-style:[transform:translateY(100%)]",
}

// Fluid mobile-drawer scrim: 160ms fade in (the moderate duration), out on moderate's exit.
const scrimClass = cn(backdropClass, "duration-(--duration-moderate) data-ending-style:duration-(--duration-moderate-exit)")

/**
 * Side sheet. Motion (Fluid mobile-drawer, moderate tier): slides in on its spring (no overshoot, so the edge
 * never gaps), out on its exit, and follows the finger 1:1 while swiped. Reduced motion: appears, leaves and
 * snaps back instantly, with no slide.
 */
function DrawerContent({ className, children, ...props }: ComponentProps<typeof DrawerPrimitive.Popup>) {
  const side = useContext(SideContext)
  return (
    <DrawerPrimitive.Portal>
      <DrawerPrimitive.Backdrop className={scrimClass} />
      <DrawerPrimitive.Viewport className="fixed inset-0 z-(--z-overlay)">
        <DrawerPrimitive.Popup
          className={cn(
            "fixed grid content-start gap-4 overflow-y-auto border-border bg-surface p-pad-container-lg text-sm text-foreground shadow-overlay outline-none",
            "transition-[transform] duration-(--duration-moderate) ease-spring-moderate data-ending-style:duration-(--duration-moderate-exit) data-ending-style:ease-exit data-swiping:transition-none motion-reduce:transition-none",
            sideClass[side],
            className,
          )}
          {...props}
        >
          {children}
          <DrawerPrimitive.Close render={<IconButton label="Close" size="sm" className="absolute top-3 right-3" />}>
            <X />
          </DrawerPrimitive.Close>
        </DrawerPrimitive.Popup>
      </DrawerPrimitive.Viewport>
    </DrawerPrimitive.Portal>
  )
}

function DrawerTitle({ className, ...props }: ComponentProps<typeof DrawerPrimitive.Title>) {
  return <DrawerPrimitive.Title className={cn("pr-8 font-display text-base font-strong tracking-tight", className)} {...props} />
}

export { Drawer, DrawerTrigger, DrawerContent, DrawerTitle, DrawerClose }
export type { DrawerProps }
