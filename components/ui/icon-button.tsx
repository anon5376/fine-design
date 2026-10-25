"use client"

import { cva } from "class-variance-authority"
import { Button, type ButtonProps } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const iconButtonVariants = cva("px-0", {
  variants: {
    size: { sm: "size-control-sm", md: "size-control-md", lg: "size-control-lg" },
  },
  defaultVariants: { size: "md" },
})

type IconButtonProps = Omit<ButtonProps, "aria-label"> & {
  /** Accessible name. Required: the button shows only an icon. */
  label: string
}

function IconButton({ label, size, variant = "ghost", className, ...props }: IconButtonProps) {
  return <Button aria-label={label} size={size} variant={variant} className={cn(iconButtonVariants({ size }), className)} {...props} />
}

export { IconButton, iconButtonVariants }
export type { IconButtonProps }
