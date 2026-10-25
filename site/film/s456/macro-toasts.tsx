"use client"

import { CircleAlert, CircleCheck, X } from "lucide-react"
import { IconButton } from "@/components/ui/icon-button"
import { ease, lerp, progress, spring, springs } from "../clock"
import { camStyle } from "./cam"

// S4 shot C, 11.5-13.0: three toasts at ~2.6x. The surface is the Toaster's own classes (toast.tsx), placed by the timeline:
// each arrives from below on the hero spring (the expressive tier with the overshoot turned up so it reads at film scale),
// and the toasts already there glide up a slot on the expressive tier. The camera keeps the stack centred as it grows.
const TOASTS = [
  { title: "Transfer sent", kind: "success" },
  { title: "Invoice paid", kind: "success" },
  { title: "Payment declined", kind: "error" },
] as const
const ARRIVE = [-0.1, 0.34, 0.68] // the first is already on its way at the cut
const PITCH = 58 // 50px card + 8px root padding, as in the Toaster
const CARD = 50
const W = 352
const TRAVEL = 64

export function MacroToasts({ t }: { t: number }) {
  const p = progress(t, 0, 1.5)
  const K = lerp(3.5, 3.8, ease.inOutSoft(p))
  // How many slots the stack has grown by (0 with the first toast, 2 with the third), smoothed.
  const grown = ARRIVE.slice(1).reduce((n, a) => n + ease.out(progress(t, a, 0.55)), 0)
  const top = -(grown * PITCH) - CARD
  const cy = top / 2 // stack runs from y = top to y = 0
  const cam = { s: K, ry: lerp(-5, 4, ease.out(p)), rx: lerp(1.5, -1.5, ease.out(p)), y: 0, p: 2400 }
  return (
    <div className="absolute inset-0">
      <div style={camStyle(cam)}>
        <div className="absolute left-1/2 top-1/2" style={{ width: W, marginLeft: -W / 2, height: 0 }}>
          {TOASTS.map((toast, k) => {
            const s = t - ARRIVE[k]
            const arrive = spring(s, springs.hero)
            // slots this toast has been pushed up by the toasts that came after it
            const lifted = ARRIVE.slice(k + 1).reduce((n, a) => n + spring(t - a, springs.expressive), 0)
            const y = -lifted * PITCH - cy + lerp(TRAVEL, 0, arrive)
            return (
              <div
                key={toast.title}
                className="absolute left-0"
                style={{ width: W, top: -CARD, opacity: progress(s, 0, 0.1), transform: `translateY(${y}px)` }}
              >
                <div className="flex items-center gap-3 rounded-container border border-border bg-surface py-2.5 pr-2 pl-3.5 text-sm text-foreground shadow-overlay" style={{ height: CARD }}>
                  {toast.kind === "success" ? (
                    <CircleCheck aria-hidden className="size-4 shrink-0 text-success-subtle-foreground" strokeWidth={1.75} />
                  ) : (
                    <CircleAlert aria-hidden className="size-4 shrink-0 text-danger-subtle-foreground" strokeWidth={1.75} />
                  )}
                  <div className="min-w-0 flex-1 font-medium">{toast.title}</div>
                  <IconButton label="Dismiss" size="sm" tabIndex={-1}>
                    <X />
                  </IconButton>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
