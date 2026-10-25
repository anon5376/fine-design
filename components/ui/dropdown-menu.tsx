"use client"

import type { ComponentProps } from "react"
import { Menu as MenuPrimitive } from "@base-ui/react/menu"
import { Check, ChevronRight } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { FluidHighlight, useFluidHover } from "@/lib/fluid-hover"
import { popupItem, popupMotion, popupSurface } from "@/lib/popup"
import { cn } from "@/lib/utils"

const DropdownMenu = MenuPrimitive.Root
const DropdownMenuTrigger = MenuPrimitive.Trigger
const DropdownMenuGroup = MenuPrimitive.Group
const DropdownMenuRadioGroup = MenuPrimitive.RadioGroup
const DropdownMenuSub = MenuPrimitive.SubmenuRoot

type DropdownMenuContentProps = ComponentProps<typeof MenuPrimitive.Popup> &
  Pick<ComponentProps<typeof MenuPrimitive.Positioner>, "side" | "align" | "sideOffset" | "alignOffset">

/** Items take real focus, so the Fluid highlight glides with the pointer and the arrow keys alike. Also used for submenus. */
function DropdownMenuContent({ className, children, side, align = "start", sideOffset = 4, alignOffset, ...props }: DropdownMenuContentProps) {
  const { ref, rect, handlers } = useFluidHover<HTMLDivElement>()
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner side={side} align={align} sideOffset={sideOffset} alignOffset={alignOffset} className="z-(--z-popover) outline-none">
        <MenuPrimitive.Popup
          ref={ref}
          {...handlers}
          className={cn(popupSurface, popupMotion, "relative max-h-(--available-height) min-w-44 overflow-y-auto p-1", className)}
          {...props}
        >
          <FluidHighlight rect={rect} />
          {children}
        </MenuPrimitive.Popup>
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  )
}

const itemClass = cn(popupItem, "cursor-pointer")

type DropdownMenuItemProps = ComponentProps<typeof MenuPrimitive.Item> & { variant?: "default" | "danger" }

function DropdownMenuItem({ className, variant = "default", ...props }: DropdownMenuItemProps) {
  return (
    <MenuPrimitive.Item
      data-fluid-item
      className={cn(itemClass, variant === "danger" && "text-danger-subtle-foreground", className)}
      {...props}
    />
  )
}

function DropdownMenuCheckboxItem({ className, children, ...props }: ComponentProps<typeof MenuPrimitive.CheckboxItem>) {
  return (
    <MenuPrimitive.CheckboxItem data-fluid-item className={cn(itemClass, "pr-8", className)} {...props}>
      {children}
      <MenuPrimitive.CheckboxItemIndicator className="absolute right-2 flex">
        <Check strokeWidth={1.75} />
      </MenuPrimitive.CheckboxItemIndicator>
    </MenuPrimitive.CheckboxItem>
  )
}

function DropdownMenuRadioItem({ className, children, ...props }: ComponentProps<typeof MenuPrimitive.RadioItem>) {
  return (
    <MenuPrimitive.RadioItem data-fluid-item className={cn(itemClass, "pr-8", className)} {...props}>
      {children}
      <MenuPrimitive.RadioItemIndicator className="absolute right-2 flex">
        <Check strokeWidth={1.75} />
      </MenuPrimitive.RadioItemIndicator>
    </MenuPrimitive.RadioItem>
  )
}

/** The glide lights it while highlighted; the static tint covers an open submenu once the highlight has moved on. */
function DropdownMenuSubTrigger({ className, children, ...props }: ComponentProps<typeof MenuPrimitive.SubmenuTrigger>) {
  return (
    <MenuPrimitive.SubmenuTrigger data-fluid-item className={cn(itemClass, "data-popup-open:not-data-highlighted:bg-hover", className)} {...props}>
      {children}
      <ChevronRight aria-hidden className="ml-auto text-muted-foreground" strokeWidth={1.5} />
    </MenuPrimitive.SubmenuTrigger>
  )
}

/** Must sit inside a <DropdownMenuGroup>. */
function DropdownMenuLabel({ className, ...props }: ComponentProps<typeof MenuPrimitive.GroupLabel>) {
  return <MenuPrimitive.GroupLabel className={cn("px-2 pt-2 pb-1 text-xs font-medium text-muted-foreground", className)} {...props} />
}

function DropdownMenuSeparator({ className, ...props }: ComponentProps<typeof Separator>) {
  return <Separator className={cn("-mx-1 my-1 w-auto", className)} {...props} />
}

/** Keyboard hint at the end of an item, e.g. <DropdownMenuShortcut>⌘D</DropdownMenuShortcut>. */
function DropdownMenuShortcut({ className, ...props }: ComponentProps<"span">) {
  return <span className={cn("ml-auto pl-4 font-mono text-2xs text-muted-foreground", className)} {...props} />
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
}
