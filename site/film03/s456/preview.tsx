"use client"

import { useState } from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardTitle } from "@/components/ui/card"
import { Dialog, DialogClose, DialogDescription, DialogFooter, DialogTitle, backdropClass } from "@/components/ui/dialog"
import { IconButton } from "@/components/ui/icon-button"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { PresetScope } from "../preset-scope"
import type { PresetId } from "../presets"

// A small app (a Card with a heading, a Switch and a primary Button) on its page, in one preset, dark. The window is the same box in
// every preset so a crossfade between two layers only changes the skin. The Dialog is Base UI's, mounted inline in the layer's own
// scope (its portal escapes to <body>, outside every scope) and posed from the film clock: its own geometry (dialog.tsx) is opacity
// and scale .97 -> 1 on the slow tier; here the spring is that tier slowed 2x with a little more bounce so it reads at film scale.
export const WINDOW = { w: 380, h: 250 }

export type DialogPose = { opacity: number; scale: number; scrim: number }

export function PreviewLayer({ preset, dialog }: { preset: PresetId; dialog?: DialogPose }) {
  const [host, setHost] = useState<HTMLElement | null>(null)
  return (
    <PresetScope preset={preset} scheme="dark" className="absolute inset-0 overflow-hidden rounded-container border-line border-border bg-muted">
      <div className="absolute inset-0 grid place-items-center">
        <Card className="w-[280px]">
          <CardTitle>Billing</CardTitle>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="font-label">Auto-pay</span>
              <Switch checked onCheckedChange={() => {}} tabIndex={-1} />
            </div>
          </CardContent>
          <CardFooter className="justify-start">
            <Button tabIndex={-1}>Save changes</Button>
          </CardFooter>
        </Card>
      </div>
      <div ref={setHost} className="absolute inset-0 overflow-hidden">
        {dialog && (
          <Dialog open modal={false}>
            <DialogPrimitive.Portal container={host}>
              <DialogPrimitive.Backdrop className={cn(backdropClass, "absolute")} style={{ opacity: dialog.scrim, transition: "none" }} />
              <DialogPrimitive.Viewport className="absolute inset-0 z-(--z-overlay) grid place-items-center p-4">
                <DialogPrimitive.Popup
                  initialFocus={false}
                  className="relative grid w-full max-w-[340px] gap-4 rounded-container border-line border-border bg-surface p-pad-container-lg text-sm text-foreground shadow-overlay outline-none"
                  style={{ opacity: dialog.opacity, scale: dialog.scale, transition: "none" }}
                >
                  <DialogTitle>Send payment</DialogTitle>
                  <DialogDescription>Northwind Ltd, $12,480.00</DialogDescription>
                  <DialogFooter>
                    <Button variant="outline" tabIndex={-1}>
                      Cancel
                    </Button>
                    <Button tabIndex={-1}>Send</Button>
                  </DialogFooter>
                  <DialogClose render={<IconButton label="Close" size="sm" className="absolute top-3 right-3" tabIndex={-1} />}>
                    <X />
                  </DialogClose>
                </DialogPrimitive.Popup>
              </DialogPrimitive.Viewport>
            </DialogPrimitive.Portal>
          </Dialog>
        )}
      </div>
    </PresetScope>
  )
}
