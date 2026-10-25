import type { ComponentType, SVGProps } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const iconVariants = cva("shrink-0", {
  variants: {
    size: { sm: "size-3.5", md: "size-4", lg: "size-5" },
  },
  defaultVariants: { size: "md" },
})

type Glyph = ComponentType<SVGProps<SVGSVGElement> & { strokeWidth?: number | string }>

type IconProps = Omit<SVGProps<SVGSVGElement>, "ref"> &
  VariantProps<typeof iconVariants> & {
    /** Any SVG component, e.g. a lucide-react icon. */
    icon: Glyph
    /** Accessible name. Without it the icon is decorative (aria-hidden). */
    label?: string
  }

/** Sizes an icon on the scale and sets the 1.5 stroke. Decorative unless `label` is given. */
function Icon({ icon: Svg, size, label, className, ...props }: IconProps) {
  return (
    <Svg
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      strokeWidth={1.5}
      className={cn(iconVariants({ size }), className)}
      {...props}
    />
  )
}

export { Icon, iconVariants }
export type { IconProps }
