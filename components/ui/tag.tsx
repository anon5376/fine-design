import type { ComponentProps } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

type TagProps = ComponentProps<"span"> & {
  /** Shows a remove button. */
  onRemove?: () => void
  /** Accessible name of the remove button. Defaults to "Remove <children>" for string children. */
  removeLabel?: string
}

/** A chip for a chosen value or filter. Static: the list that owns tags decides how removal looks. */
function Tag({ className, children, onRemove, removeLabel, ...props }: TagProps) {
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center gap-1 whitespace-nowrap rounded-control border border-border bg-surface pl-2 text-xs font-medium text-foreground",
        onRemove ? "pr-0.5" : "pr-2",
        className,
      )}
      {...props}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel ?? (typeof children === "string" ? `Remove ${children}` : "Remove")}
          className="inline-flex size-5 cursor-pointer items-center justify-center rounded-[0.25rem] text-muted-foreground outline-none transition-colors duration-(--duration-fast) hover:bg-hover hover:text-foreground focus-visible:focus-ring focus-visible:outline-offset-0"
        >
          <X className="size-3" strokeWidth={2} aria-hidden />
        </button>
      )}
    </span>
  )
}

export { Tag }
export type { TagProps }
