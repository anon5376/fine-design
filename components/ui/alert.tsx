import type { ComponentProps, ReactNode } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { CircleAlert, CircleCheck, Info, TriangleAlert, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

const alertVariants = cva("grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3 gap-y-1 rounded-container border-line p-pad-container-sm text-sm", {
  variants: {
    variant: {
      neutral: "border-border bg-surface [--alert-accent:var(--foreground)] [--alert-icon:var(--muted-foreground)]",
      info: "border-transparent bg-info-subtle [--alert-accent:var(--info-subtle-foreground)]",
      success: "border-transparent bg-success-subtle [--alert-accent:var(--success-subtle-foreground)]",
      warning: "border-transparent bg-warning-subtle [--alert-accent:var(--warning-subtle-foreground)]",
      danger: "border-transparent bg-danger-subtle [--alert-accent:var(--danger-subtle-foreground)]",
    },
  },
  defaultVariants: { variant: "neutral" },
})

const icons: Record<NonNullable<VariantProps<typeof alertVariants>["variant"]>, LucideIcon> = {
  neutral: Info,
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  danger: CircleAlert,
}

type AlertProps = Omit<ComponentProps<"div">, "title"> &
  VariantProps<typeof alertVariants> & {
    title: ReactNode
    /** Replaces the variant's icon. */
    icon?: LucideIcon
    /** One follow-up, usually a small <Button>. */
    action?: ReactNode
  }

/** Inline, persistent message. Static: it is part of the page, not an event. Danger alerts use role="alert"; the rest role="status". */
function Alert({ className, variant, title, icon, action, children, ...props }: AlertProps) {
  const Icon = icon ?? icons[variant ?? "neutral"]
  return (
    <div role={variant === "danger" ? "alert" : "status"} className={cn(alertVariants({ variant }), className)} {...props}>
      <Icon aria-hidden className="mt-0.5 size-4 text-[var(--alert-icon,var(--alert-accent))]" strokeWidth={1.75} />
      <p className="font-title text-(--alert-accent)">{title}</p>
      {children && <div className="col-start-2 text-foreground">{children}</div>}
      {action && <div className="col-start-2 mt-2 flex gap-2">{action}</div>}
    </div>
  )
}

export { Alert, alertVariants }
export type { AlertProps }
