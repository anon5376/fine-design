import type { ComponentProps, ReactNode } from "react"
import { cn } from "@/lib/utils"

type EmptyStateProps = Omit<ComponentProps<"div">, "title"> & {
  /** ASCII drawing (string, rendered in a <pre>) or any decorative node. Hidden from assistive tech. */
  art?: ReactNode
  /** One sentence saying what is empty. */
  title: ReactNode
  /** One way out, usually a <Button>. */
  action?: ReactNode
}

function EmptyState({ className, art, title, action, ...props }: EmptyStateProps) {
  return (
    <div
      className={cn("grid justify-items-center gap-4 rounded-container border-line border-border px-6 py-12 text-center", className)}
      {...props}
    >
      {art != null &&
        (typeof art === "string" ? (
          <pre aria-hidden className="font-mono text-xs leading-tight text-muted-foreground">
            {art}
          </pre>
        ) : (
          <div aria-hidden className="text-muted-foreground">
            {art}
          </div>
        ))}
      <p className="max-w-xs text-sm font-title text-foreground text-balance">{title}</p>
      {action}
    </div>
  )
}

export { EmptyState }
export type { EmptyStateProps }
