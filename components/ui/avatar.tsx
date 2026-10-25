"use client"

import { useState, type ComponentProps } from "react"
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

/**
 * An image that finishes loading fades in over the initials on the fast tier (opacity, ease-enter);
 * the initials stay underneath, hidden from assistive tech, until the fade ends. An image that is
 * already complete on mount appears at once. The name moves to the image immediately. Reduced
 * motion keeps the fade, which is not movement.
 */
function Avatar({ className, size, src, alt, fallback, ...props }: AvatarProps) {
  // `fade` once a load was seen in progress; a cached image reports "loaded" without a "loading" first.
  const [fade, setFade] = useState(false)
  const [fading, setFading] = useState(false)
  return (
    <AvatarPrimitive.Root className={cn(avatarVariants({ size }), className)} {...props}>
      {fading && (
        <span aria-hidden className="absolute inset-0 flex items-center justify-center">
          {fallback}
        </span>
      )}
      {src && (
        <AvatarPrimitive.Image
          src={src}
          alt={alt}
          onLoadingStatusChange={status => {
            if (status === "loading") setFade(true)
            setFading(status === "loaded" && fade)
          }}
          onTransitionEnd={() => setFading(false)}
          className={cn(
            "relative size-full object-cover transition-opacity duration-(--duration-fast) ease-enter",
            fade && "data-starting-style:opacity-0",
          )}
        />
      )}
      <AvatarPrimitive.Fallback role="img" aria-label={alt}>
        {fallback}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  )
}

export { Avatar, avatarVariants }
export type { AvatarProps }
