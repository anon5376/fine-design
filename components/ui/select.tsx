"use client"

import type { ComponentProps } from "react"
import { Select as SelectPrimitive } from "@base-ui/react/select"
import { Check, ChevronsUpDown } from "lucide-react"
import type { VariantProps } from "class-variance-authority"
import { inputVariants } from "@/components/ui/input"
import { FluidHighlight, useFluidHover } from "@/lib/fluid-hover"
import { popupItem, popupMotion, popupSurface } from "@/lib/popup"
import { cn } from "@/lib/utils"

/** Pass `items` ({ value, label }[]) so the trigger can show the selected label. */
const Select = SelectPrimitive.Root

function SelectTrigger({ className, size, children, ...props }: ComponentProps<typeof SelectPrimitive.Trigger> & VariantProps<typeof inputVariants>) {
  return (
    <SelectPrimitive.Trigger
      className={cn(inputVariants({ size }), "flex cursor-pointer items-center justify-between gap-2 text-left data-popup-open:border-ring", className)}
      {...props}
    >
      {children ?? <SelectPrimitive.Value className="truncate data-placeholder:text-muted-foreground" />}
      <SelectPrimitive.Icon className="shrink-0 text-muted-foreground">
        <ChevronsUpDown className="size-4" strokeWidth={1.5} />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({ className, children, ...props }: ComponentProps<typeof SelectPrimitive.Popup>) {
  const { ref, rect, handlers } = useFluidHover<HTMLDivElement>()
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner alignItemWithTrigger={false} sideOffset={4} className="z-(--z-popover) outline-none">
        <SelectPrimitive.Popup
          className={cn(popupSurface, popupMotion, "max-h-[min(18.75rem,var(--available-height))] min-w-(--anchor-width) overflow-y-auto p-1", className)}
          {...props}
        >
          <SelectPrimitive.List ref={ref} {...handlers} className="relative">
            <FluidHighlight rect={rect} />
            {children}
          </SelectPrimitive.List>
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  )
}

function SelectItem({ className, children, ...props }: ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item data-fluid-item className={cn(popupItem, "pr-8", className)} {...props}>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="absolute right-2 flex">
        <Check strokeWidth={1.75} />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  )
}

export { Select, SelectTrigger, SelectContent, SelectItem }
