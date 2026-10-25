"use client"

import type { ComponentProps } from "react"
import { Avatar as AvatarPrimitive } from "@base-ui/react/avatar"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const avatarVariants = cva(
  "relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-muted font-medium text-muted-foreground",
  {
    variants: {
      size: { sm: "size-6 text-2xs", md: "size-8 text-xs", lg: "size-10 text-sm" },
    },
    defaultVariants: { size: "md" },
  },
)

type AvatarProps = Omit<ComponentProps<typeof AvatarPrimitive.Root>, "children"> &
  VariantProps<typeof avatarVariants> & {
    src?: string
    /** Describes the person; also the fallback's accessible name. */
    alt: string
    /** Initials shown while the image loads or when it fails. */
    fallback: string
  }

function Avatar({ className, size, src, alt, fallback, ...props }: AvatarProps) {
  return (
    <AvatarPrimitive.Root className={cn(avatarVariants({ size }), className)} {...props}>
      {src && <AvatarPrimitive.Image src={src} alt={alt} className="size-full object-cover" />}
      <AvatarPrimitive.Fallback role="img" aria-label={alt}>
        {fallback}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  )
}

export { Avatar, avatarVariants }
export type { AvatarProps }
