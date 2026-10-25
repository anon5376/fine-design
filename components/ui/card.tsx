import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"

function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("grid gap-4 rounded-container border-line border-border bg-surface p-pad-container-md text-foreground shadow-raised", className)}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1", className)} {...props} />
}

function CardTitle({ className, ...props }: ComponentProps<"h3">) {
  return <h3 className={cn("font-display text-base font-strong tracking-tight", className)} {...props} />
}

function CardContent({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("grid gap-3 text-sm", className)} {...props} />
}

function CardFooter({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex flex-wrap items-center justify-end gap-2", className)} {...props} />
}

export { Card, CardHeader, CardTitle, CardContent, CardFooter }
