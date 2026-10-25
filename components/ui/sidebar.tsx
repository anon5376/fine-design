"use client"

import { createContext, useContext, type ComponentProps, type ReactNode } from "react"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { FluidHighlight, useFluidHover } from "@/lib/fluid-hover"
import { cn } from "@/lib/utils"

type Size = NonNullable<VariantProps<typeof sidebarVariants>["size"]>

const sidebarVariants = cva("flex h-full shrink-0 flex-col overflow-y-auto border-r border-border bg-background text-foreground", {
  variants: {
    size: { sm: "w-48 gap-4 px-2 py-4", md: "w-60 gap-8 px-3 py-6" },
  },
  defaultVariants: { size: "md" },
})

const sidebarItemVariants = cva(
  [
    "group relative flex shrink-0 items-center gap-2 rounded-control text-muted-foreground outline-none focus-visible:focus-ring",
    "transition-colors duration-(--duration-fast) hover:text-foreground aria-[current=page]:bg-active aria-[current=page]:font-medium aria-[current=page]:text-foreground",
    // Fluid hover feedback on icons: stroke 1.5 -> 2, held on the current page.
    "[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:stroke-[1.5] [&_svg]:transition-[stroke-width] [&_svg]:duration-(--duration-fast) hover:[&_svg]:stroke-2 aria-[current=page]:[&_svg]:stroke-2",
  ],
  {
    variants: {
      size: { sm: "h-7 px-2 text-xs pointer-coarse:h-8", md: "h-8 px-3 text-sm" },
    },
    defaultVariants: { size: "md" },
  },
)

const SizeContext = createContext<Size>("md")
// True inside SidebarContent, where the shared glide supplies the hover tint.
const GlideContext = createContext(false)

const inset: Record<Size, string> = { sm: "px-2", md: "px-3" }
const rhythm: Record<Size, string> = { sm: "gap-4", md: "gap-6" }

type SidebarProps = ComponentProps<"aside"> & VariantProps<typeof sidebarVariants>

/** Compound sidebar: Header, Content (the nav, holding Groups of Items), Footer. `size="sm"` is the compact version. */
function Sidebar({ className, size, ...props }: SidebarProps) {
  return (
    <SizeContext value={size ?? "md"}>
      <aside className={cn(sidebarVariants({ size }), className)} {...props} />
    </SizeContext>
  )
}

function SidebarHeader({ className, ...props }: ComponentProps<"div">) {
  const size = useContext(SizeContext)
  return <div className={cn("flex items-center", inset[size], className)} {...props} />
}

type SidebarContentProps = Omit<ComponentProps<"nav">, "aria-label"> & {
  /** Names the landmark, e.g. "Workspace". Required: the page may hold several navs. */
  "aria-label": string
}

/**
 * The nav landmark. Motion (Fluid Functionalism sidebar, MIT; fast tier): one hover highlight glides between
 * items across every group, and keyboard focus drives it too. Reduced motion keeps the fade and drops the travel.
 */
function SidebarContent({ className, children, ...props }: SidebarContentProps) {
  const size = useContext(SizeContext)
  const { ref, rect, handlers } = useFluidHover<HTMLDivElement>()
  return (
    <nav className={className} {...props}>
      <GlideContext value>
        <div ref={ref} {...handlers} className={cn("relative grid", rhythm[size])}>
          <FluidHighlight rect={rect} />
          {children}
        </div>
      </GlideContext>
    </nav>
  )
}

function SidebarGroup({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("grid gap-0.5", className)} {...props} />
}

function SidebarGroupLabel({ className, ...props }: ComponentProps<"h2">) {
  const size = useContext(SizeContext)
  return <h2 className={cn("pb-1 text-xs text-muted-foreground", inset[size], className)} {...props} />
}

type SidebarItemProps = useRender.ComponentProps<"a"> & {
  /** Leading icon; sized and stroked by the item. */
  icon?: ReactNode
  /** Trailing figure, e.g. an unread or open count. */
  count?: ReactNode
  /** Marks the current page: sets aria-current="page" and tints the item. */
  active?: boolean
}

/** A link row. Render a router link with `render={<Link href="/invoices" />}`. */
function SidebarItem({ render, className, icon, count, active, children, ...props }: SidebarItemProps) {
  const size = useContext(SizeContext)
  const glide = useContext(GlideContext)
  return useRender({
    render: render ?? <a />,
    props: {
      "data-fluid-item": "",
      "aria-current": active ? "page" : undefined,
      className: cn(sidebarItemVariants({ size }), !glide && "hover:bg-hover", className),
      ...props,
      children: (
        <>
          {icon}
          <span className="min-w-0 flex-1 truncate">{children}</span>
          {count != null && <span className="figures text-xs text-muted-foreground group-aria-[current=page]:text-foreground">{count}</span>}
        </>
      ),
    },
  })
}

function SidebarFooter({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("mt-auto", className)} {...props} />
}

export { Sidebar, SidebarHeader, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarItem, SidebarFooter, sidebarVariants, sidebarItemVariants }
export type { SidebarProps, SidebarContentProps, SidebarItemProps }
