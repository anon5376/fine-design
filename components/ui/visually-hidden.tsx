import { useRender } from "@base-ui/react/use-render"
import { cn } from "@/lib/utils"

/** Content for screen readers only. Renders <span>. */
function VisuallyHidden({ render, className, ...props }: useRender.ComponentProps<"span">) {
  return useRender({ render: render ?? <span />, props: { className: cn("sr-only", className), ...props } })
}

export { VisuallyHidden }
