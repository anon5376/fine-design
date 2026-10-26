"use client"

import { Slider } from "@/components/ui/slider"
import { ease, lerp, progress, spring, type SpringSpec } from "@/site/film/clock"
import { MacroFrame, CenterBox } from "./frame"
import { Pointer } from "./pointer"

// s3 macro 3, 11.0-12.5, Ledger dark: a track press glides the thumb and the range to the pressed spot; the readout follows the thumb.
// The real Slider, controlled from the clock. The component's own glide is a CSS transition (inset-inline-start and width on the
// moderate spring) that the renderer cannot pin, so the value is stepped here along the same spring, slowed 2x to read, and the
// transition stays off (data-glide is only set by a real press). Press at 80% at 0.3, then at 25% at 0.85.
const W = 300
const START = 42
const P1 = 0.3
const P2 = 0.85
const GLIDE: SpringSpec = { visualDuration: 0.32, bounce: 0 } // moderate, 2x
const K = 5.6
const TRACK_Y = 56 // centre of the 20px control, in box pixels

export function SliderMacro({ t }: { t: number }) {
  const v = lerp(lerp(START, 80, spring(t - P1, GLIDE)), 25, spring(t - P2, GLIDE))
  const p = progress(t, 0, 1.5)
  const cam = { s: lerp(0.95, 1.04, ease.out(p)), ry: lerp(4, -3, ease.out(p)), rx: lerp(-2, 1.5, ease.out(p)), y: 0, p: 2400 }
  const reach = ease.out(progress(t, 0, P1))
  const to = (pct: number) => (pct / 100) * W
  const slide = ease.inOut(progress(t, 0.55, P2 - 0.55))
  const px = t < 0.55 ? lerp(to(80) + 170, to(80), reach) : lerp(to(80), to(25), slide)
  const py = t < 0.55 ? lerp(TRACK_Y + 120, TRACK_Y, reach) : TRACK_Y
  return (
    <MacroFrame preset="ledger" scheme="dark" t={t} cam={cam} caption="Slider">
      <CenterBox w={W} h={110} zoom={K}>
        <div className="relative flex flex-col" style={{ width: W, gap: 14 }}>
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">Volume</span>
            <span className="figures text-2xl font-strong text-accent">{Math.round(v)}</span>
          </div>
          <Slider aria-label="Volume" value={v} min={0} max={100} step={0.01} />
          {/* the scale the presses land on */}
          <div className="relative h-5">
            {[0, 25, 50, 75, 100].map(n => (
              <div key={n} className="absolute top-0 flex flex-col items-center gap-1" style={{ left: to(n), transform: "translateX(-50%)" }}>
                <div className="h-1.5 w-px bg-border" />
                <span className="figures text-xs text-muted-foreground">{n}</span>
              </div>
            ))}
          </div>
          <Pointer x={px} y={py} k={K} press={t < 0.7 ? t - P1 : t - P2} opacity={1 - progress(t, 1.2, 0.2)} />
        </div>
      </CenterBox>
    </MacroFrame>
  )
}
