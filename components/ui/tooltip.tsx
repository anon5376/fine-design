"use client"

import { createContext, useContext, type ComponentProps, type ReactElement, type ReactNode } from "react"
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip"
import { tooltipMotion } from "@/lib/popup"
import { cn } from "@/lib/utils"

/** ms before a tooltip opens on hover; the one default, for a TooltipProvider and for a Tooltip without one. */
const DEFAULT_DELAY = 300

const InProvider = createContext(false)

/** Wrap a toolbar so moving between triggers shows the next tooltip at once. Its `delay` applies to every Tooltip inside. */
function TooltipProvider({ delay = DEFAULT_DELAY, ...props }: ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <InProvider.Provider value>
      <TooltipPrimitive.Provider delay={delay} {...props} />
    </InProvider.Provider>
  )
}

type TooltipProps = {
  /** The element that shows the tooltip; it must accept a ref and props (e.g. <IconButton>). */
  children: ReactElement
  content: ReactNode
  side?: "top" | "bottom" | "left" | "right"
  /** ms before opening on hover; overrides the TooltipProvider's delay. */
  delay?: number
  className?: string
}

/** Short label for an icon-only control. Never put the only copy of important text here. */
function Tooltip({ children, content, side = "top", delay, className }: TooltipProps) {
  const inProvider = useContext(InProvider)
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger delay={delay ?? (inProvider ? undefined : DEFAULT_DELAY)} render={children} />
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Positioner side={side} sideOffset={6} className="z-(--z-tooltip)">
          <TooltipPrimitive.Popup
            className={cn(
              "rounded-control bg-primary px-2 py-1 text-xs font-medium text-primary-foreground",
              tooltipMotion,
              className,
            )}
          >
            {content}
          </TooltipPrimitive.Popup>
        </TooltipPrimitive.Positioner>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  )
}

export { Tooltip, TooltipProvider }
export type { TooltipProps }
