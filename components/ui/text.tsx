import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const textVariants = cva("", {
  variants: {
    size: { xs: "text-xs", sm: "text-sm", md: "text-base", lg: "text-lg" },
    variant: {
      default: "text-foreground",
      muted: "text-muted-foreground",
      success: "text-success-subtle-foreground",
      warning: "text-warning-subtle-foreground",
      danger: "text-danger-subtle-foreground",
    },
  },
  defaultVariants: { size: "sm", variant: "default" },
})

type TextProps = useRender.ComponentProps<"p"> & VariantProps<typeof textVariants>

/** Body text. Renders <p>; pass `render={<span />}` for inline text. */
function Text({ render, className, size, variant, ...props }: TextProps) {
  return useRender({ render: render ?? <p />, props: { className: cn(textVariants({ size, variant }), className), ...props } })
}

export { Text, textVariants }
export type { TextProps }
