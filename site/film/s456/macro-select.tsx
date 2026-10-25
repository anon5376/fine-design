"use client"

import { Check } from "lucide-react"
import { Select, SelectTrigger } from "@/components/ui/select"
import { FluidHighlight } from "@/lib/fluid-hover"
import { popupItem, popupSurface } from "@/lib/popup"
import { cn } from "@/lib/utils"
import { ease, lerp, progress, spring, springs, type SpringSpec } from "../clock"
import { camStyle } from "./cam"

// S4 shot B, 10.0-11.5: a Select at ~3x. The real trigger; the popup is a replica built from popupSurface / popupItem, opening on
// popupMotion's pose (opacity 0, scaleY .96, 4px slide, moderate), with the real FluidHighlight driven from the timeline.
const ITEMS = [
  { value: "usd", label: "US dollar" },
  { value: "eur", label: "Euro" },
  { value: "gbp", label: "Pound sterling" },
  { value: "jpy", label: "Yen" },
]
const W = 260
const ROW = 32
const OPEN = 0.12
const HOVER = [0.4, 0.66, 0.92] // highlight lands on rows 0, 1, 2
const PICK = 1.02
const SWAP = 1.12
const CHECK: SpringSpec = { visualDuration: 0.2, bounce: 0.35 }

export function MacroSelect({ t }: { t: number }) {
  const p = progress(t, 0, 1.5)
  const K = lerp(4.0, 4.5, ease.inOutSoft(p))
  const cam = { s: K, ry: lerp(4.5, -3.5, ease.out(p)), rx: lerp(-1.5, 1.5, ease.out(p)), y: lerp(14, -40, ease.out(p)), p: 2600 }
  const open = spring(t - OPEN, springs.moderate)
  const idx = t >= HOVER[2] ? 2 : t >= HOVER[1] ? 1 : t >= HOVER[0] ? 0 : -1
  const rect = idx < 0 ? null : { x: 0, y: idx * ROW, width: W - 10, height: ROW, session: 1 }
  const pressed = t >= PICK - 0.06 && t < PICK
  const check = spring(t - PICK, CHECK)
  const value = t >= SWAP ? "gbp" : "eur"
  return (
    <div className="absolute inset-0">
      <div style={camStyle(cam)}>
        <div className="absolute left-1/2 top-1/2" style={{ width: W, height: 36 + 4 + 4 * ROW + 10, marginLeft: -W / 2, marginTop: -(36 + 4 + 4 * ROW + 10) / 2 - 8, transform: "scale(1)" }}>
          <Select items={ITEMS} value={value}>
            <SelectTrigger className={cn("w-full", open > 0.5 && "border-ring")} />
          </Select>
          <div
            className={cn(popupSurface, "p-1")}
            style={{
              width: W,
              marginTop: 4,
              transformOrigin: "50% 0",
              opacity: Math.min(1, open * 1.4),
              transform: `translateY(${lerp(-4, 0, open)}px) scaleY(${lerp(0.96, 1, open)})`,
            }}
          >
            <div className="relative">
              <FluidHighlight rect={rect} />
              {ITEMS.map((item, i) => (
                <div key={item.value} data-fluid-item className={cn(popupItem, "pr-8")} style={i === 2 && pressed ? { opacity: 0.9 } : undefined}>
                  <span>{item.label}</span>
                  {i === 2 && (
                    <Check
                      strokeWidth={1.75}
                      className="absolute right-2"
                      style={{ opacity: Math.min(1, check * 2), transform: `scale(${lerp(0.3, 1, check)})` }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
