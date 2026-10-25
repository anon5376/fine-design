"use client"

import type { ComponentProps } from "react"
import { useRender } from "@base-ui/react/use-render"
import { ChevronRight, Ellipsis } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { FluidHighlight, useFluidHover } from "@/lib/fluid-hover"
import { cn } from "@/lib/utils"

/**
 * Motion: Fluid Functionalism's hover highlight (MIT, spring.fast): one pill glides between the links and the
 * collapsed trigger. Reduced motion: it jumps. Put crumbs in <BreadcrumbItem>s, with a <BreadcrumbSeparator /> between them.
 */
function Breadcrumb({ className, children, ...props }: ComponentProps<"nav">) {
  const { ref, rect, handlers } = useFluidHover<HTMLOListElement>()
  return (
    <nav aria-label="Breadcrumb" className={className} {...props}>
      <ol ref={ref} {...handlers} className="relative flex flex-wrap items-center gap-x-0.5 text-sm">
        <FluidHighlight rect={rect} />
        {children}
      </ol>
    </nav>
  )
}

function BreadcrumbItem({ className, ...props }: ComponentProps<"li">) {
  return <li className={cn("inline-flex items-center", className)} {...props} />
}

const crumbClass = "relative inline-flex h-8 items-center rounded-control px-1.5 outline-none focus-visible:focus-ring"

/** Renders <a>; pass `render={<RouterLink href="..." />}` to use a router's link. */
function BreadcrumbLink({ className, render, ...props }: useRender.ComponentProps<"a">) {
  return useRender({
    render: render ?? <a />,
    props: {
      "data-fluid-item": "",
      className: cn(crumbClass, "text-muted-foreground transition-colors duration-(--duration-fast) hover:text-foreground", className),
      ...props,
    },
  })
}

/** The current page: plain text, not a link. */
function BreadcrumbPage({ className, ...props }: ComponentProps<"span">) {
  return <span aria-current="page" className={cn("inline-flex h-8 items-center px-1.5 font-label text-foreground", className)} {...props} />
}

function BreadcrumbSeparator({ className, children, ...props }: ComponentProps<"li">) {
  return (
    <li role="presentation" aria-hidden className={cn("inline-flex items-center text-muted-foreground [&_svg]:size-3.5", className)} {...props}>
      {children ?? <ChevronRight strokeWidth={1.5} />}
    </li>
  )
}

type BreadcrumbEllipsisProps = ComponentProps<typeof DropdownMenuTrigger> & {
  /** Accessible name of the trigger. */
  label?: string
}

/** The collapsed middle. Children are the hidden crumbs, as <DropdownMenuItem render={<a href="..." />}>. */
function BreadcrumbEllipsis({ className, label = "Show hidden pages", children, ...props }: BreadcrumbEllipsisProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        data-fluid-item
        aria-label={label}
        className={cn(crumbClass, "min-w-8 cursor-pointer justify-center text-muted-foreground transition-colors duration-(--duration-fast) hover:text-foreground data-popup-open:text-foreground", className)}
        {...props}
      >
        <Ellipsis aria-hidden className="size-4" strokeWidth={1.5} />
      </DropdownMenuTrigger>
      <DropdownMenuContent>{children}</DropdownMenuContent>
    </DropdownMenu>
  )
}

export { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbEllipsis }
