"use client"

import type { ComponentProps } from "react"
import { Popover as PopoverPrimitive } from "@base-ui/react/popover"
import { popupMotion, popupSurface } from "@/lib/popup"
import { cn } from "@/lib/utils"

const Popover = PopoverPrimitive.Root
const PopoverTrigger = PopoverPrimitive.Trigger
const PopoverClose = PopoverPrimitive.Close

type PopoverContentProps = ComponentProps<typeof PopoverPrimitive.Popup> &
  Pick<ComponentProps<typeof PopoverPrimitive.Positioner>, "side" | "align" | "sideOffset">

function PopoverContent({ className, side = "bottom", align = "center", sideOffset = 6, ...props }: PopoverContentProps) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner side={side} align={align} sideOffset={sideOffset} className="z-(--z-popover)">
        <PopoverPrimitive.Popup className={cn(popupSurface, popupMotion, "grid w-72 max-w-(--available-width) gap-3 p-4 text-sm", className)} {...props} />
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  )
}

function PopoverTitle({ className, ...props }: ComponentProps<typeof PopoverPrimitive.Title>) {
  return <PopoverPrimitive.Title className={cn("text-sm font-medium", className)} {...props} />
}

export { Popover, PopoverTrigger, PopoverContent, PopoverTitle, PopoverClose }
