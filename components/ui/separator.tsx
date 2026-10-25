import type { ComponentProps } from "react"
import { Separator as SeparatorPrimitive } from "@base-ui/react/separator"
import { cn } from "@/lib/utils"

/** A rule between groups. Decorative by default; Base UI sets role="separator" and orientation. */
function Separator({ className, orientation = "horizontal", ...props }: ComponentProps<typeof SeparatorPrimitive>) {
  return (
    <SeparatorPrimitive
      orientation={orientation}
      className={cn("shrink-0 bg-border", orientation === "horizontal" ? "h-px w-full" : "w-px self-stretch", className)}
      {...props}
    />
  )
}

export { Separator }
