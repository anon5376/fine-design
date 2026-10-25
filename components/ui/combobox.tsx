"use client"

import { createContext, useContext, useEffect, useState, type ComponentProps } from "react"
import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox"
import { Check, ChevronsUpDown } from "lucide-react"
import { inputVariants } from "@/components/ui/input"
import { FluidHighlight, useFluidHover } from "@/lib/fluid-hover"
import { popupItem, popupMotion, popupSurface } from "@/lib/popup"
import { cn } from "@/lib/utils"

type Highlight = { index: number; keyboard: boolean }
const HighlightContext = createContext<Highlight | null>(null)

/**
 * Pass `items`; Base UI filters them as the user types. Children get each item via <ComboboxList>{item => ...}</ComboboxList>. Wrap it in <Field> with a <FieldLabel> before it.
 * Focus stays in the input, so the popup's gliding highlight follows onItemHighlighted (Fluid's base_combobox).
 */
function Combobox<Value, Multiple extends boolean | undefined = false>({ onItemHighlighted, ...props }: ComboboxPrimitive.Root.Props<Value, Multiple>) {
  const [highlight, setHighlight] = useState<Highlight | null>(null)
  return (
    <HighlightContext.Provider value={highlight}>
      <ComboboxPrimitive.Root
        {...props}
        onItemHighlighted={(item, details) => {
          setHighlight(item === undefined ? null : { index: details.index, keyboard: details.reason !== "pointer" })
          onItemHighlighted?.(item, details)
        }}
      />
    </HighlightContext.Provider>
  )
}

function ComboboxInput({ className, ...props }: ComponentProps<typeof ComboboxPrimitive.Input>) {
  return (
    <ComboboxPrimitive.InputGroup className="relative w-full">
      <ComboboxPrimitive.Input className={cn(inputVariants(), "pr-9", className)} {...props} />
      <ComboboxPrimitive.Trigger
        aria-label="Show options"
        className="absolute inset-y-0 right-0 flex w-9 cursor-pointer items-center justify-center rounded-r-control text-muted-foreground outline-none hover:text-foreground focus-visible:focus-ring"
      >
        <ChevronsUpDown className="size-4" strokeWidth={1.5} />
      </ComboboxPrimitive.Trigger>
    </ComboboxPrimitive.InputGroup>
  )
}

function ComboboxContent({ className, children, ...props }: ComponentProps<typeof ComboboxPrimitive.Popup>) {
  const { ref, rect, show, hide, handlers } = useFluidHover<HTMLDivElement>()
  const highlight = useContext(HighlightContext)
  // Keyboard and automatic highlights light their row; pointer ones belong to the pointer handlers.
  useEffect(() => {
    if (!highlight) hide()
    else if (highlight.keyboard) {
      const row = ref.current?.querySelector<HTMLElement>(`[role=option][id$="-${highlight.index}"]`)
      if (row) show(row)
    }
  }, [highlight, ref, show, hide])
  return (
    <ComboboxPrimitive.Portal>
      <ComboboxPrimitive.Positioner sideOffset={4} className="z-(--z-popover) outline-none">
        <ComboboxPrimitive.Popup
          ref={ref}
          {...handlers}
          className={cn(popupSurface, popupMotion, "relative max-h-[min(18.75rem,var(--available-height))] w-(--anchor-width) overflow-y-auto p-1", className)}
          {...props}
        >
          <FluidHighlight rect={rect} />
          {children}
        </ComboboxPrimitive.Popup>
      </ComboboxPrimitive.Positioner>
    </ComboboxPrimitive.Portal>
  )
}

const ComboboxList = ComboboxPrimitive.List

function ComboboxEmpty({ className, ...props }: ComponentProps<typeof ComboboxPrimitive.Empty>) {
  return <ComboboxPrimitive.Empty className={cn("px-2 py-1.5 text-sm text-muted-foreground empty:hidden", className)} {...props} />
}

function ComboboxItem({ className, children, ...props }: ComponentProps<typeof ComboboxPrimitive.Item>) {
  return (
    <ComboboxPrimitive.Item data-fluid-item className={cn(popupItem, "pr-8", className)} {...props}>
      {children}
      <ComboboxPrimitive.ItemIndicator className="absolute right-2 flex">
        <Check strokeWidth={1.75} />
      </ComboboxPrimitive.ItemIndicator>
    </ComboboxPrimitive.Item>
  )
}

export { Combobox, ComboboxInput, ComboboxContent, ComboboxList, ComboboxEmpty, ComboboxItem }
