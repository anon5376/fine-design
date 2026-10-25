"use client"

import { createContext, useContext, type ComponentProps } from "react"
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cva, type VariantProps } from "class-variance-authority"
import { FluidHighlight, useFluidHover } from "@/lib/fluid-hover"
import { cn } from "@/lib/utils"

type TabsStyle = {
  variant: NonNullable<VariantProps<typeof tabsListVariants>["variant"]>
  size: NonNullable<VariantProps<typeof tabsListVariants>["size"]>
}
const StyleContext = createContext<TabsStyle>({ variant: "segmented", size: "md" })

const tabsListVariants = cva("group/tabs relative isolate items-stretch select-none", {
  variants: {
    variant: {
      segmented: "inline-flex self-start rounded-container bg-muted p-0.5",
      underline: "flex gap-1 border-b border-border",
    },
    size: { sm: "h-7", md: "h-9" },
  },
  defaultVariants: { variant: "segmented", size: "md" },
})

const tabsTriggerVariants = cva(
  [
    "relative z-10 inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-control font-medium text-muted-foreground outline-none",
    "transition-[color] duration-(--duration-fast) hover:text-foreground focus-visible:text-foreground focus-visible:focus-ring data-active:text-foreground data-disabled:pointer-events-none data-disabled:opacity-50",
    // Fluid hover feedback on icons: stroke 1.5 -> 2.
    "[&_svg]:shrink-0 [&_svg]:stroke-[1.5] [&_svg]:transition-[stroke-width] [&_svg]:duration-(--duration-fast) hover:[&_svg]:stroke-2 data-active:[&_svg]:stroke-2",
  ],
  {
    variants: {
      size: {
        sm: "px-2.5 text-xs [&_svg]:size-3.5",
        md: "px-3 text-sm [&_svg]:size-4",
      },
    },
    defaultVariants: { size: "md" },
  },
)

// Indicator: moves on Base UI's --active-tab-* vars, translate and size on the moderate spring, the dim on fast.
const indicatorMotion =
  "transition-[translate,width,height,opacity] [transition-duration:var(--duration-moderate),var(--duration-moderate),var(--duration-moderate),var(--duration-fast)] ease-spring-moderate motion-reduce:transition-none"

const indicatorVariants = cva(["absolute top-0 left-0 w-(--active-tab-width) translate-x-(--active-tab-left)", indicatorMotion], {
  variants: {
    variant: {
      segmented: "h-(--active-tab-height) translate-y-(--active-tab-top) rounded-control border border-border bg-surface shadow-raised",
      underline: "top-auto -bottom-px h-0.5 bg-primary",
    },
  },
  defaultVariants: { variant: "segmented" },
})

type TabsProps = ComponentProps<typeof TabsPrimitive.Root> & Partial<TabsStyle>

function Tabs({ className, variant = "segmented", size = "md", ...props }: TabsProps) {
  return (
    <StyleContext value={{ variant, size }}>
      <TabsPrimitive.Root className={cn("flex flex-col gap-4", className)} {...props} />
    </StyleContext>
  )
}

/**
 * Tab strip with the selection indicator inside it. Motion (Fluid tabs, base_tabs): the indicator travels on the
 * moderate spring and dims to 85% while another tab is hovered; the shared Fluid highlight previews the next tab on
 * the fast tier. Arrow keys move focus and select. Reduced motion: the indicator jumps, the hover fade stays.
 */
function TabsList({ className, children, ...props }: ComponentProps<typeof TabsPrimitive.List>) {
  const { variant, size } = useContext(StyleContext)
  const { ref, rect, handlers } = useFluidHover<HTMLDivElement>()
  return (
    <TabsPrimitive.List ref={ref} activateOnFocus {...handlers} className={cn(tabsListVariants({ variant, size }), className)} {...props}>
      <FluidHighlight rect={rect} />
      <TabsPrimitive.Indicator
        renderBeforeHydration
        className={cn(indicatorVariants({ variant }), "group-has-[[role=tab]:not([data-active]):hover]/tabs:opacity-85")}
      />
      {children}
    </TabsPrimitive.List>
  )
}

function TabsTrigger({ className, ...props }: ComponentProps<typeof TabsPrimitive.Tab>) {
  const { size } = useContext(StyleContext)
  return <TabsPrimitive.Tab data-fluid-item className={cn(tabsTriggerVariants({ size }), className)} {...props} />
}

function TabsContent({ className, ...props }: ComponentProps<typeof TabsPrimitive.Panel>) {
  return <TabsPrimitive.Panel className={cn("rounded-control text-sm outline-none focus-visible:focus-ring", className)} {...props} />
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants, tabsTriggerVariants }
export type { TabsProps }
