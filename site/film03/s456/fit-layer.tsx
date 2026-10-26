"use client"

import type { CSSProperties } from "react"
import { Card } from "@/components/ui/card"
import { Text } from "@/components/ui/text"
import { PresetScene } from "../preset-scope"
import type { Scheme } from "../presets"
import { Caption } from "./shared"

// The real figure-fit, as in dashboard-shell: each figure sits in an @container parent that sets its size (text-3xl) and the row sets
// --figure-chars to the longest figure, so Poster's wide mono shrinks to its card by CSS alone. The row is laid out at its natural
// width (NAT css px at full width) and CSS-zoomed by Z, so the layout is real and the type is drawn at its final size, not blown
// up from a small raster. At full width the row spans 1700px of the 1920px frame (88%) and the figures are about 61px; the strip behind
// is the container's own extent in the camera's plane.
const STATS = [
  { label: "Balance", value: "$248,630.42", main: true },
  { label: "Sent", value: "$86,420.00" },
  { label: "Received", value: "$112,905.18" },
] as const
const CHARS = Math.max(...STATS.map(s => s.value.length))
export const NAT = 850
export const Z = 2
const MARGIN = 80
const ROW_Y = 548 // the row's centre; the readout above and the dimension line below sit around it
const READOUT = { top: 312, size: 72 } // smaller than the figures: the cards are the subject
const DIM_Y = 756

/** One scheme of the shot. `frac` is the row's width as a fraction of the full 1700px. */
export function FitLayer({ scheme, frac }: { scheme: Scheme; frac: number }) {
  const natW = NAT * frac
  const screenW = natW * Z
  const stripW = screenW + MARGIN * 2
  return (
    <PresetScene preset="poster" scheme={scheme}>
      <div className={`absolute inset-y-0 bottom-[150px] border-b-line border-l-line border-r-line border-border ${scheme === "light" ? "bg-muted" : "bg-background"}`} style={{ left: (1920 - stripW) / 2, width: stripW }} />
      <div className="absolute inset-x-0 flex justify-center" style={{ top: ROW_Y, transform: "translateY(-50%)" }}>
        <div className="grid grid-cols-3 gap-3" style={{ width: natW, zoom: Z, "--figure-chars": CHARS } as CSSProperties}>
          {STATS.map(stat => (
            <Card key={stat.label} className="gap-1 p-pad-container-sm">
              <Text variant="muted">{stat.label}</Text>
              <Text className="@container flex items-center text-3xl font-title">
                <span className={`figures figure-fit${"main" in stat ? " text-accent" : ""}`}>{stat.value}</span>
              </Text>
            </Card>
          ))}
        </div>
      </div>
      <div className="figures absolute inset-x-0 text-center text-muted-foreground" style={{ top: READOUT.top, fontSize: READOUT.size, lineHeight: 1, letterSpacing: "-0.04em" }}>
        {Math.round(natW)}px
      </div>
      {/* dimension line: the container's width in css px */}
      <div className="absolute flex items-center" style={{ left: (1920 - screenW) / 2, width: screenW, top: DIM_Y }}>
        <div className="h-8 w-[3px] bg-foreground" />
        <div className="h-[3px] flex-1 bg-foreground" />
        <div className="h-8 w-[3px] bg-foreground" />
      </div>
      <Caption>figure-fit</Caption>
    </PresetScene>
  )
}
