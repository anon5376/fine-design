import type { CSSProperties } from "react"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const gap = { none: "gap-0", xs: "gap-1", sm: "gap-2", md: "gap-4", lg: "gap-6", xl: "gap-8", "2xl": "gap-12" }

const stackVariants = cva("flex", {
  variants: {
    direction: { column: "flex-col", row: "flex-row" },
    gap,
    align: { start: "items-start", center: "items-center", end: "items-end", stretch: "items-stretch", baseline: "items-baseline" },
    justify: { start: "justify-start", center: "justify-center", end: "justify-end", between: "justify-between" },
    wrap: { true: "flex-wrap" },
  },
  defaultVariants: { direction: "column", gap: "md" },
})

type StackProps = useRender.ComponentProps<"div"> & VariantProps<typeof stackVariants>

/** One-axis layout. Column by default; `direction="row"` for inline groups. */
function Stack({ render, className, direction, gap, align, justify, wrap, ...props }: StackProps) {
  return useRender({ render: render ?? <div />, props: { className: cn(stackVariants({ direction, gap, align, justify, wrap }), className), ...props } })
}

const gridVariants = cva("grid", {
  variants: {
    cols: { 1: "grid-cols-1", 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4", 6: "grid-cols-6", 12: "grid-cols-12" },
    gap,
  },
  defaultVariants: { gap: "md" },
})

type GridProps = useRender.ComponentProps<"div"> &
  VariantProps<typeof gridVariants> & {
    /** Responsive alternative to `cols`: as many columns as fit at this minimum width (any CSS length). */
    minItemWidth?: string
  }

/** Two-axis layout. Fixed `cols`, or `minItemWidth` to reflow by available width. */
function Grid({ render, className, cols, gap, minItemWidth, style, ...props }: GridProps) {
  const reflow = minItemWidth ? ({ gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, ${minItemWidth}), 1fr))` } as CSSProperties) : undefined
  return useRender({ render: render ?? <div />, props: { className: cn(gridVariants({ cols, gap }), className), style: { ...reflow, ...style }, ...props } })
}

const containerVariants = cva("mx-auto w-full px-4 md:px-8", {
  variants: {
    size: { sm: "max-w-2xl", md: "max-w-4xl", lg: "max-w-6xl", xl: "max-w-7xl", full: "max-w-none" },
  },
  defaultVariants: { size: "lg" },
})

type ContainerProps = useRender.ComponentProps<"div"> & VariantProps<typeof containerVariants>

/** Centered page column with the page gutters. */
function Container({ render, className, size, ...props }: ContainerProps) {
  return useRender({ render: render ?? <div />, props: { className: cn(containerVariants({ size }), className), ...props } })
}

export { Stack, Grid, Container, stackVariants, gridVariants, containerVariants }
export type { StackProps, GridProps, ContainerProps }
