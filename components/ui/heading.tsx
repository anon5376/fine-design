import { createElement, type ComponentProps } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const headingVariants = cva("font-display font-title text-foreground text-balance", {
  variants: {
    size: {
      sm: "text-base",
      md: "text-lg",
      lg: "text-2xl tracking-tight",
      xl: "text-4xl tracking-tight",
      display: "text-6xl tracking-tight",
    },
  },
})

const DEFAULT_SIZE = { 1: "lg", 2: "md", 3: "sm", 4: "sm", 5: "sm", 6: "sm" } as const

type HeadingProps = ComponentProps<"h2"> &
  VariantProps<typeof headingVariants> & {
    /** Document outline level, independent of size. */
    level?: 1 | 2 | 3 | 4 | 5 | 6
  }

/** Section heading. `level` sets the tag (h1–h6); `size` sets the look and defaults from the level. */
function Heading({ level = 2, size, className, ...props }: HeadingProps) {
  return createElement(`h${level}`, { className: cn(headingVariants({ size: size ?? DEFAULT_SIZE[level] }), className), ...props })
}

export { Heading, headingVariants }
export type { HeadingProps }
