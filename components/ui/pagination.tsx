"use client"

import { useId, useState, type ComponentProps, type ReactElement, type ReactNode } from "react"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { ChevronLeft, ChevronRight, Ellipsis } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import { IconButton } from "@/components/ui/icon-button"
import { spring } from "@/lib/motion"
import { cn } from "@/lib/utils"

type PageItem = number | "ellipsis"

/**
 * The page numbers to show, with "ellipsis" for each gap of two or more pages. The first and last page always
 * show, and the length stays constant (siblings * 2 + 5) so the control doesn't change width as you page.
 * A gap of a single page shows that page instead of an ellipsis.
 */
function paginationRange(page: number, pageCount: number, siblings = 1): PageItem[] {
  const count = Math.max(0, Math.floor(pageCount))
  const side = Math.max(0, Math.floor(siblings))
  const all = (from: number, to: number) => Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => from + i)

  if (count <= side * 2 + 5) return all(1, count)

  const current = Math.min(Math.max(1, Math.floor(page)), count)
  const left = Math.max(current - side, 1)
  const right = Math.min(current + side, count)
  const gapBefore = left > 3
  const gapAfter = right < count - 2
  const edge = 3 + side * 2

  if (!gapBefore) return [...all(1, edge), "ellipsis", count]
  if (!gapAfter) return [1, "ellipsis", ...all(count - edge + 1, count)]
  return [1, "ellipsis", ...all(left, right), "ellipsis", count]
}

const pageVariants = cva(
  [
    "relative isolate inline-flex shrink-0 cursor-pointer select-none items-center justify-center rounded-control font-medium text-foreground",
    "outline-none transition-colors duration-(--duration-fast) hover:bg-hover active:bg-active focus-visible:focus-ring",
    "aria-[current=page]:text-primary-foreground aria-[current=page]:hover:bg-transparent aria-[current=page]:active:bg-transparent",
  ],
  {
    variants: {
      size: {
        sm: "h-7 min-w-7 px-1.5 text-xs pointer-coarse:h-9 pointer-coarse:min-w-9",
        md: "h-9 min-w-9 px-2 text-sm",
        lg: "h-10 min-w-10 px-2.5 text-sm",
      },
    },
    defaultVariants: { size: "md" },
  },
)

type PageRender = (page: number) => ReactElement<{ className?: string; children?: ReactNode }>

type PageControlProps = Omit<ComponentProps<"button">, "children"> &
  VariantProps<typeof pageVariants> & {
    page: number
    current: boolean
    indicatorId: string
    render?: ReactElement
  }

/** Motion: SlidePagination (easyui, MIT) slides one shared indicator to the chosen page via layoutId, on spring.moderate (Fluid's tier for a moving selection). Reduced motion: no shared layout, so it jumps. */
function PageControl({ page, current, indicatorId, size, render, className, ...props }: PageControlProps) {
  const reduce = useReducedMotion()
  return useRender({
    render: render ?? <button />,
    props: {
      type: render ? undefined : "button",
      "aria-label": `Page ${page}`,
      "aria-current": current ? "page" : undefined,
      className: cn(pageVariants({ size }), "figures", className),
      children: (
        <>
          {current && (
            <motion.span
              aria-hidden
              layoutId={reduce ? undefined : indicatorId}
              className="absolute inset-0 -z-10 rounded-control bg-primary"
              transition={spring.moderate}
            />
          )}
          {page}
        </>
      ),
      ...props,
    },
  })
}

type PaginationProps = Omit<ComponentProps<"nav">, "children" | "onChange"> &
  VariantProps<typeof pageVariants> & {
    pageCount: number
    /** Current page, 1-based (controlled). */
    page?: number
    defaultPage?: number
    onPageChange?: (page: number) => void
    /** Pages shown on each side of the current one. */
    siblings?: number
    /** Element to render each page control as, e.g. `renderPage={p => <a href={`?page=${p}`} />}`. */
    renderPage?: PageRender
  }

function Pagination({ pageCount, page, defaultPage = 1, onPageChange, siblings = 1, size = "md", renderPage, className, ...props }: PaginationProps) {
  const [internal, setInternal] = useState(defaultPage)
  const indicatorId = useId()
  const last = Math.max(1, pageCount)
  const current = Math.min(Math.max(1, page ?? internal), last)

  const select = (next: number) => {
    const clamped = Math.min(Math.max(1, next), last)
    if (clamped === current) return
    if (page === undefined) setInternal(clamped)
    onPageChange?.(clamped)
  }

  const step = (to: number, label: string, icon: ReactNode) => {
    const unavailable = to < 1 || to > last
    return (
      <li>
        <IconButton
          label={label}
          size={size}
          aria-disabled={unavailable || undefined}
          render={!unavailable && renderPage ? renderPage(to) : undefined}
          onClick={() => !unavailable && select(to)}
          className="pointer-coarse:size-9 aria-disabled:pointer-events-none aria-disabled:opacity-50"
        >
          {icon}
        </IconButton>
      </li>
    )
  }

  return (
    <nav aria-label="Pagination" className={className} {...props}>
      <ul className="flex items-center gap-1">
        {step(current - 1, "Previous page", <ChevronLeft />)}
        {paginationRange(current, last, siblings).map((item, i) =>
          item === "ellipsis" ? (
            <li key={`ellipsis-${i}`} aria-hidden className={cn(pageVariants({ size }), "pointer-events-none cursor-default text-muted-foreground")}>
              <Ellipsis className="size-4" strokeWidth={1.5} />
            </li>
          ) : (
            <li key={item}>
              <PageControl page={item} current={item === current} indicatorId={indicatorId} size={size} render={renderPage?.(item)} onClick={() => select(item)} />
            </li>
          ),
        )}
        {step(current + 1, "Next page", <ChevronRight />)}
      </ul>
    </nav>
  )
}

export { Pagination, paginationRange, pageVariants }
export type { PaginationProps, PageItem }
