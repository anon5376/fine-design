"use client"

import { createContext, useContext, useState, type ComponentProps, type MouseEvent, type ReactNode } from "react"
import { useRender } from "@base-ui/react/use-render"
import { cva } from "class-variance-authority"
import { Menu } from "lucide-react"
import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { IconButton } from "@/components/ui/icon-button"
import { FluidHighlight, useFluidHover } from "@/lib/fluid-hover"
import { cn } from "@/lib/utils"

const navbarLinkVariants = cva(
  [
    "relative flex shrink-0 items-center whitespace-nowrap rounded-control px-3 text-sm text-muted-foreground outline-none focus-visible:focus-ring",
    "transition-colors duration-(--duration-fast) hover:text-foreground aria-[current=page]:bg-active aria-[current=page]:font-medium aria-[current=page]:text-foreground",
  ],
  {
    variants: {
      size: { md: "h-9", lg: "h-10" },
    },
    defaultVariants: { size: "md" },
  },
)

// "bar" links sit in the header; "menu" links sit in the drawer and close it when followed.
type Placement = { size: "md" | "lg"; close?: () => void }
const PlacementContext = createContext<Placement>({ size: "md" })

type NavbarProps = Omit<ComponentProps<"header">, "children"> & {
  /** Wordmark slot; usually a <NavbarBrand>. */
  brand: ReactNode
  /** The one action, e.g. a Button. It stays in the bar at every width. */
  action?: ReactNode
  /** Names the links' nav landmark. */
  label?: string
  /** <NavbarLink>s. Inline from md up; in a right-side Drawer below it. */
  children: ReactNode
}

/**
 * Sticky site header. Motion (Fluid Functionalism hover highlight, MIT; fast tier): one highlight glides
 * between the links. Below md the links move into a Drawer (moderate tier, see drawer.tsx).
 */
function Navbar({ brand, action, label = "Primary", className, children, ...props }: NavbarProps) {
  const [open, setOpen] = useState(false)
  return (
    <header className={cn("sticky top-0 z-(--z-sticky) border-b border-border bg-background text-foreground", className)} {...props}>
      <div className="mx-auto flex h-14 w-full max-w-[90rem] items-center gap-6 px-4 md:px-6">
        {brand}
        <NavbarLinks aria-label={label} className="hidden md:block">
          {children}
        </NavbarLinks>
        <div className="ml-auto flex items-center gap-2">
          {action}
          <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger render={<IconButton label="Open menu" className="md:hidden" />}>
              <Menu />
            </DrawerTrigger>
            <DrawerContent>
              <DrawerTitle>Menu</DrawerTitle>
              <PlacementContext value={{ size: "lg", close: () => setOpen(false) }}>
                <NavbarLinks aria-label={label} vertical>
                  {children}
                </NavbarLinks>
              </PlacementContext>
            </DrawerContent>
          </Drawer>
        </div>
      </div>
    </header>
  )
}

function NavbarLinks({ vertical, className, children, ...props }: ComponentProps<"nav"> & { vertical?: boolean }) {
  const { ref, rect, handlers } = useFluidHover<HTMLDivElement>()
  return (
    <nav className={className} {...props}>
      <div ref={ref} {...handlers} className={cn("relative flex gap-1", vertical && "flex-col gap-0.5")}>
        <FluidHighlight rect={rect} />
        {children}
      </div>
    </nav>
  )
}

type NavbarLinkProps = useRender.ComponentProps<"a"> & {
  /** Marks the current page: sets aria-current="page" and tints the link. */
  active?: boolean
}

/** A primary link. Render a router link with `render={<Link href="/invoices" />}`. */
function NavbarLink({ render, className, active, onClick, ...props }: NavbarLinkProps) {
  const { size, close } = useContext(PlacementContext)
  return useRender({
    render: render ?? <a />,
    props: {
      "data-fluid-item": "",
      "aria-current": active ? "page" : undefined,
      className: cn(navbarLinkVariants({ size }), className),
      onClick: (e: MouseEvent<HTMLAnchorElement>) => {
        onClick?.(e)
        close?.()
      },
      ...props,
    },
  })
}

/** Wordmark link. Static. */
function NavbarBrand({ render, className, ...props }: useRender.ComponentProps<"a">) {
  return useRender({
    render: render ?? <a />,
    props: {
      className: cn("inline-flex h-9 shrink-0 items-center rounded-control text-base font-semibold tracking-tight outline-none focus-visible:focus-ring", className),
      ...props,
    },
  })
}

export { Navbar, NavbarLink, NavbarBrand, navbarLinkVariants }
export type { NavbarProps, NavbarLinkProps }
