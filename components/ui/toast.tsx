"use client"

import { Toast as ToastPrimitive } from "@base-ui/react/toast"
import { CircleAlert, CircleCheck, X } from "lucide-react"
import { IconButton } from "@/components/ui/icon-button"
import { Button, Spinner } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const manager = ToastPrimitive.createToastManager()

/**
 * Call from anywhere once <Toaster /> is mounted:
 * toast.add({ title: "Transfer sent", type: "success" }), toast.promise(p, { loading, success, error }).
 * Types: "success" | "error" | "loading"; anything else renders without an icon.
 */
const toast = manager

function Toaster() {
  return (
    <ToastPrimitive.Provider toastManager={manager} limit={3}>
      <ToastPrimitive.Portal>
        <ToastPrimitive.Viewport className="fixed right-4 bottom-2 left-4 z-(--z-toast) outline-none sm:left-auto sm:w-88">
          <ToastList />
        </ToastPrimitive.Viewport>
      </ToastPrimitive.Portal>
    </ToastPrimitive.Provider>
  )
}

const icon = {
  success: <CircleCheck aria-hidden className="size-4 shrink-0 text-success-subtle-foreground" strokeWidth={1.75} />,
  error: <CircleAlert aria-hidden className="size-4 shrink-0 text-danger-subtle-foreground" strokeWidth={1.75} />,
  loading: <Spinner className="-mx-0.5 size-5 shrink-0 text-muted-foreground" />,
} as Record<string, React.ReactNode>

/**
 * Motion: rises 16px and fades in on the expressive tier (Rare UI's FAQ SEND spring, for feedback arriving) and fades out on slow's exit.
 * Toasts stack from Base UI's --toast-offset-y and glide to a new place on the moderate tier when a sibling is added or leaves.
 * The inline swipe transform tracks the finger 1:1 and a short swipe settles back on moderate. Over-limit toasts fade out and stay inert.
 * Reduced motion keeps the fade only: no rise, glide or settle.
 */
function ToastList() {
  const { toasts } = ToastPrimitive.useToastManager()
  return toasts.map(t => (
    <ToastPrimitive.Root
      key={t.id}
      toast={t}
      className={cn(
        // The root owns the 8px gap below the card, so Base UI's measured heights (and --toast-offset-y) already include it.
        "group absolute right-0 bottom-0 left-0 pb-2 outline-none",
        "[transform:translate(var(--toast-swipe-movement-x,0px),calc(var(--toast-swipe-movement-y,0px)-var(--toast-offset-y)))]",
        "transition-[opacity,translate,transform] duration-[var(--duration-expressive),var(--duration-expressive),var(--duration-moderate)] ease-[var(--ease-spring-expressive),var(--ease-spring-expressive),var(--ease-spring-moderate)]",
        "motion-reduce:transition-[opacity] motion-reduce:duration-(--duration-fast) motion-reduce:ease-enter data-swiping:transition-none",
        "data-starting-style:translate-y-4 data-starting-style:opacity-0",
        "data-ending-style:opacity-0 data-ending-style:duration-[var(--duration-slow-exit),var(--duration-moderate),var(--duration-moderate)] data-ending-style:ease-[var(--ease-exit),var(--ease-spring-moderate),var(--ease-spring-moderate)]",
        "data-limited:pointer-events-none data-limited:opacity-0",
      )}
    >
      <div className="flex items-center gap-3 rounded-container border border-border bg-surface py-2.5 pr-2 pl-3.5 text-sm text-foreground shadow-overlay group-focus-visible:focus-ring">
        {t.type && icon[t.type]}
        <ToastPrimitive.Content className="min-w-0 flex-1">
          <ToastPrimitive.Title className="font-medium" />
        </ToastPrimitive.Content>
        {t.actionProps && <ToastPrimitive.Action render={<Button variant="outline" size="sm" />} />}
        <ToastPrimitive.Close render={<IconButton label="Dismiss" size="sm" />}>
          <X />
        </ToastPrimitive.Close>
      </div>
    </ToastPrimitive.Root>
  ))
}

export { Toaster, toast }
