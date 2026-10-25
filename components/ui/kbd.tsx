import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"

/** One key. Put several side by side for a chord. */
function Kbd({ className, ...props }: ComponentProps<"kbd">) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-[0.25rem] border border-border bg-muted px-1 font-mono text-2xs font-medium text-muted-foreground",
        className,
      )}
      {...props}
    />
  )
}

export { Kbd }
