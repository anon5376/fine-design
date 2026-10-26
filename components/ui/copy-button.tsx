"use client"

import { useEffect, useRef, useState } from "react"
import { Copy } from "lucide-react"
import { IconButton, type IconButtonProps } from "@/components/ui/icon-button"
import { cn } from "@/lib/utils"

type CopyStatus = "idle" | "copied" | "failed"

type CopyButtonProps = Omit<IconButtonProps, "label" | "onClick" | "children"> & {
  /** The text written to the clipboard. */
  text: string
  /** How long the copied (or failed) state shows, in ms. */
  timeout?: number
  /** Accessible name before copying. The other states read "Copied" and "Copy failed". */
  label?: string
}

// Each icon is a layer that fades and scales: in on the fast tier, out on its exit. Scale is motion-safe only,
// so reduced motion keeps the crossfade and drops the travel.
const layer = [
  "col-start-1 row-start-1 flex opacity-0 motion-safe:scale-50 transition-[opacity,scale] duration-(--duration-fast-exit) ease-exit",
  "data-on:opacity-100 motion-safe:data-on:scale-100 data-on:duration-(--duration-fast) data-on:ease-enter",
].join(" ")

// The mark draws on the moderate tier and retracts with the fade; reduced motion shows it whole.
const draw = [
  "[stroke-dasharray:1] [stroke-dashoffset:1] transition-[stroke-dashoffset] duration-(--duration-fast-exit) ease-exit motion-reduce:transition-none",
  "group-data-on/layer:[stroke-dashoffset:0] group-data-on/layer:duration-(--duration-moderate) group-data-on/layer:ease-spring-moderate",
].join(" ")

const mark = { pathLength: 1, stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round" } as const

const messages: Record<CopyStatus, string> = { idle: "", copied: "Copied", failed: "Copy failed" }

/**
 * Icon button that writes `text` to the clipboard. On click the copy icon leaves (fade and scale to 0.5, fast exit),
 * a check enters (fast) while its stroke draws (moderate), and after `timeout` it reverts on the fast exit.
 * If the clipboard refuses, a danger X stands in for the check. Reduced motion keeps the crossfade and drops the
 * scale and the draw. The accessible name flips to "Copied" or "Copy failed" on the same render as the icon, and a
 * polite live region says it too. Idea from Rare UI's Code Block copy button, rareui.com.
 */
function CopyButton({ text, timeout = 1500, label = "Copy", className, ...props }: CopyButtonProps) {
  const [status, setStatus] = useState<CopyStatus>("idle")
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])

  async function copy() {
    let next: CopyStatus = "copied"
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      next = "failed"
    }
    setStatus(next)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setStatus("idle"), timeout)
  }

  const on = (s: CopyStatus) => (status === s ? "" : undefined)
  return (
    <>
      <IconButton label={status === "idle" ? label : messages[status]} onClick={copy} className={className} {...props}>
        <span aria-hidden className="grid size-4 place-items-center">
          <span data-on={on("idle")} className={layer}>
            <Copy className="size-4" />
          </span>
          <span data-on={on("copied")} className={cn("group/layer", layer)}>
            <svg viewBox="0 0 16 16" fill="none" className="size-4">
              <path d="M3 8.5 6.5 12 13 4.5" className={draw} {...mark} />
            </svg>
          </span>
          <span data-on={on("failed")} className={cn("group/layer text-danger-subtle-foreground", layer)}>
            <svg viewBox="0 0 16 16" fill="none" className="size-4">
              <path d="M4 4l8 8" className={draw} {...mark} />
              <path d="M12 4l-8 8" className={draw} {...mark} />
            </svg>
          </span>
        </span>
      </IconButton>
      <span role="status" className="sr-only">
        {messages[status]}
      </span>
    </>
  )
}

export { CopyButton }
export type { CopyButtonProps }
