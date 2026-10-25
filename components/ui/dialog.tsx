"use client"

import type { ComponentProps } from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { X } from "lucide-react"
import { IconButton } from "@/components/ui/icon-button"
import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogClose = DialogPrimitive.Close

/** Scrim shared by Dialog, Drawer and CommandPalette. Fluid dialog overlay (slow tier); stops taking pointer events once it starts closing. */
const backdropClass =
  "fixed inset-0 z-(--z-overlay) bg-overlay transition-opacity duration-(--duration-slow) ease-enter data-closed:pointer-events-none data-starting-style:opacity-0 data-ending-style:opacity-0 data-ending-style:duration-(--duration-slow-exit) data-ending-style:ease-exit"

/** Centered popup motion shared by Dialog and CommandPalette. Fluid dialog (slow tier): opacity and scale 0.97 → 1 on its spring, out on its exit. */
const dialogMotion =
  "transition-[opacity,scale] duration-(--duration-slow) ease-spring-slow data-starting-style:scale-97 data-starting-style:opacity-0 data-ending-style:scale-97 data-ending-style:opacity-0 data-ending-style:duration-(--duration-slow-exit) data-ending-style:ease-exit"

type DialogContentProps = ComponentProps<typeof DialogPrimitive.Popup> & {
  /** Renders the corner close button. */
  showClose?: boolean
}

/**
 * Centered modal. Motion (Fluid dialog, slow tier): see dialogMotion; the scrim fades on the same tier.
 * Reduced motion keeps the fades and drops the scale.
 */
function DialogContent({ className, children, showClose = true, ...props }: DialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop className={backdropClass} />
      <DialogPrimitive.Viewport className="fixed inset-0 z-(--z-overlay) grid place-items-center overflow-y-auto p-4">
        <DialogPrimitive.Popup
          className={cn(
            "relative grid w-full max-w-md gap-4 rounded-container border-line border-border bg-surface p-pad-container-lg text-sm text-foreground shadow-overlay outline-none",
            dialogMotion,
            className,
          )}
          {...props}
        >
          {children}
          {showClose && (
            <DialogPrimitive.Close render={<IconButton label="Close" size="sm" className="absolute top-3 right-3" />}>
              <X />
            </DialogPrimitive.Close>
          )}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Viewport>
    </DialogPrimitive.Portal>
  )
}

function DialogTitle({ className, ...props }: ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title className={cn("pr-8 font-display text-base font-strong tracking-tight", className)} {...props} />
}

function DialogDescription({ className, ...props }: ComponentProps<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description className={cn("text-muted-foreground", className)} {...props} />
}

function DialogFooter({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex flex-wrap justify-end gap-2 pt-2", className)} {...props} />
}

export { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogFooter, DialogClose, backdropClass, dialogMotion }
