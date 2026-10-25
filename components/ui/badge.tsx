import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex h-5 shrink-0 items-center gap-1 whitespace-nowrap rounded-pill px-2 text-xs font-label [&_svg]:size-3 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        neutral: "bg-muted text-foreground",
        outline: "border-line border-border text-foreground",
        success: "bg-success-subtle text-success-subtle-foreground",
        warning: "bg-warning-subtle text-warning-subtle-foreground",
        danger: "bg-danger-subtle text-danger-subtle-foreground",
        info: "bg-info-subtle text-info-subtle-foreground",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
)

type BadgeProps = useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>

/** Status pill. Static: a status change is read from the new label, not from motion. */
function Badge({ render, className, variant, ...props }: BadgeProps) {
  return useRender({ render: render ?? <span />, props: { className: cn(badgeVariants({ variant }), className), ...props } })
}

export { Badge, badgeVariants }
export type { BadgeProps }
