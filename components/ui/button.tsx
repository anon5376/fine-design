"use client"

import { cloneElement, isValidElement, type ComponentProps, type ReactElement, type ReactNode } from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  [
    "group relative isolate inline-flex shrink-0 cursor-pointer select-none items-center justify-center whitespace-nowrap rounded-control font-medium",
    "outline-none focus-visible:focus-ring disabled:pointer-events-none disabled:opacity-50 aria-busy:cursor-progress",
    // Fluid hover feedback on icons: stroke 1.5 -> 2.
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([data-spinner])]:stroke-[1.5] [&_svg:not([data-spinner])]:transition-[stroke-width] [&_svg:not([data-spinner])]:duration-(--duration-fast) hover:[&_svg:not([data-spinner])]:stroke-2",
  ],
  {
    variants: {
      variant: {
        primary: "text-primary-foreground",
        secondary: "text-secondary-foreground",
        outline: "text-foreground",
        ghost: "text-foreground",
        danger: "text-danger-foreground",
      },
      size: {
        sm: "h-7 gap-1 px-2.5 text-xs [&_svg]:size-3.5",
        md: "h-9 gap-1.5 px-3.5 text-sm [&_svg]:size-4",
        lg: "h-10 gap-2 px-4 text-sm [&_svg]:size-4",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
)

// Fluid Functionalism press geometry: the fill sits 1px inside the button and a
// same-color 1px spread fills it back out. Pressing collapses the spread, so the
// button shrinks exactly 1px per side at any width, where a scale would warp.
const surfaceVariants = cva(
  "absolute inset-px rounded-[inherit] bg-(--btn-bg) shadow-[0_0_0_1px_var(--btn-bg)] transition-[box-shadow,background-color] duration-(--duration-moderate) ease-enter group-active:shadow-[0_0_0_0_var(--btn-bg)] group-active:duration-(--duration-fast)",
  {
    variants: {
      variant: {
        primary: "[--btn-bg:var(--primary)] group-hover:[--btn-bg:var(--primary-hover)] group-active:[--btn-bg:var(--primary-active)]",
        secondary: "[--btn-bg:var(--secondary)] group-hover:[--btn-bg:var(--secondary-hover)] group-active:[--btn-bg:var(--secondary-active)]",
        // The border is an outer ring at rest that hands off to an inset ring when pressed.
        outline:
          "[--btn-bg:transparent] shadow-[0_0_0_1px_var(--input),inset_0_0_0_0_var(--input)] group-hover:[--btn-bg:var(--hover)] group-active:[--btn-bg:var(--active)] group-active:shadow-[0_0_0_0_var(--input),inset_0_0_0_1px_var(--input)]",
        ghost: "[--btn-bg:transparent] group-hover:[--btn-bg:var(--hover)] group-active:[--btn-bg:var(--active)]",
        danger: "[--btn-bg:var(--danger)] group-hover:[--btn-bg:var(--danger-hover)] group-active:[--btn-bg:var(--danger-active)]",
      },
    },
    defaultVariants: { variant: "primary" },
  },
)

/** Fluid Functionalism figure-eight spinner. Reduced motion draws the whole glyph, still. */
function Spinner({ className }: { className?: string }) {
  return (
    <svg data-spinner viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M 12 12 C 14 8.5 19 8.5 19 12 C 19 15.5 14 15.5 12 12 C 10 8.5 5 8.5 5 12 C 5 15.5 10 15.5 12 12 Z"
        stroke="currentColor"
        strokeWidth="1.125"
        strokeLinecap="round"
        pathLength="100"
        className="animate-spinner [stroke-dasharray:15_85] motion-reduce:animate-none motion-reduce:[stroke-dasharray:none]"
      />
    </svg>
  )
}

type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    /** Shows a spinner, keeps the label's width, and blocks clicks. */
    loading?: boolean
    /** Element to render instead of <button>, e.g. `render={<a href="/pricing" />}`. */
    render?: ReactElement<{ className?: string; children?: ReactNode }>
  }

function Button({ className, variant, size, loading = false, render, disabled, children, ...props }: ButtonProps) {
  const inner = (
    <>
      <span aria-hidden className={cn(surfaceVariants({ variant }))} />
      <span className={cn("relative inline-flex items-center justify-center gap-[inherit]", loading && "opacity-0")}>{children}</span>
      {loading && (
        <span aria-hidden className="absolute inset-0 flex items-center justify-center">
          <Spinner className="aspect-square h-full" />
        </span>
      )}
    </>
  )
  const classes = cn(buttonVariants({ variant, size }), className)

  if (render && isValidElement(render)) {
    return cloneElement(render, { ...(props as object), className: cn(classes, render.props.className) }, inner)
  }
  return (
    <ButtonPrimitive className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {inner}
    </ButtonPrimitive>
  )
}

export { Button, Spinner, buttonVariants }
export type { ButtonProps }
