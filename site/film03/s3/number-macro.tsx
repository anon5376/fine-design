"use client"

import { useLayoutEffect, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { tabsListVariants, tabsTriggerVariants } from "@/components/ui/tabs"
import { ease, lerp, progress, spring, type SpringSpec } from "@/site/film/clock"
import { MacroFrame, CenterBox, unitOf } from "./frame"
import { Pointer } from "./pointer"

// s3 macro 1, 8.0-9.5, Poster light: the Tabs indicator glides to Yearly, then the price rolls from $24 to $240.
// Tabs and AnimatedNumber are driven by the film clock (their own CSS and WAAPI springs cannot be pinned by the renderer) with the
// real classes and the real behaviour, slowed to read: the indicator on the moderate spring (translate and width together),
// then every changed digit slides a line up because the value rose, unchanged ones stay put, and the added digit grows in width.
// Digits are matched by place from the right, as AnimatedNumber keys them: $24 -> $240 adds the leftmost place, the old 2 and 4 become 4 and 0.
const SWITCH = 0.3
const CHANGE = 0.78
const STAGGER = 0.05
const GLIDE: SpringSpec = { visualDuration: 0.32, bounce: 0 } // moderate, 2x
const ROLL: SpringSpec = { visualDuration: 0.3, bounce: 0.12 }
const GROW: SpringSpec = { visualDuration: 0.32, bounce: 0 }
const FROM = ["2", "4"]
const TO = ["2", "4", "0"]
const K = 4.0

type Box = { x: number; y: number; w: number; h: number }

export function NumberMacro({ t }: { t: number }) {
  const list = useRef<HTMLDivElement>(null)
  const unit = useRef<HTMLDivElement>(null)
  const trig = useRef<(HTMLDivElement | null)[]>([])
  const probe = useRef<HTMLSpanElement>(null)
  // Tab boxes are relative to the list (offsets ignore the camera's transform); `at` places the list inside the card wrapper.
  const [m, setM] = useState<{ tabs: Box[]; at: { x: number; y: number }; digit: number } | null>(null)
  useLayoutEffect(() => {
    const l = list.current!
    const u = unitOf(unit.current!)
    const tabs = trig.current.map(el => ({ x: el!.offsetLeft / u, y: el!.offsetTop / u, w: el!.offsetWidth / u, h: el!.offsetHeight / u }))
    setM({ tabs, at: { x: l.offsetLeft / u, y: l.offsetTop / u }, digit: probe.current!.offsetWidth / u })
  }, [])

  const p = progress(t, 0, 1.5)
  const cam = { s: lerp(0.94, 1.04, ease.out(p)), ry: lerp(-6, 3, ease.out(p)), rx: lerp(2.5, -1, ease.out(p)), y: lerp(10, -10, ease.out(p)), p: 2200 }

  const glide = spring(t - SWITCH, GLIDE)
  const sel = ease.enter(progress(t, SWITCH, 0.16))
  const a = m?.tabs[0]
  const b = m?.tabs[1]
  const ind = a && b ? { x: lerp(a.x, b.x, glide), w: lerp(a.w, b.w, glide), y: a.y, h: a.h } : null
  const tx = b && m ? { x: m.at.x + b.x + b.w / 2, y: m.at.y + b.y + b.h / 2 } : { x: 0, y: 0 }
  const reach = ease.out(progress(t, 0, 0.3))
  const px = lerp(tx.x + 300, tx.x, reach)
  const py = lerp(tx.y + 190, tx.y, reach)

  return (
    <MacroFrame preset="poster" scheme="light" t={t} cam={cam} caption="AnimatedNumber">
      <CenterBox w={330} h={212} zoom={K}>
        <div className="relative" style={{ opacity: m ? 1 : 0 }}>
          <div ref={unit} className="invisible absolute" style={{ width: 100, height: 0 }} />
          <Card className="w-[330px]">
            <div ref={list} className={tabsListVariants({ variant: "segmented", size: "md" })}>
              {ind && (
                <div
                  className="absolute left-0 top-0 rounded-control border-line border-border bg-surface shadow-control"
                  style={{ width: ind.w, height: ind.h, transform: `translate(${ind.x}px, ${ind.y}px)` }}
                />
              )}
              {["Monthly", "Yearly"].map((label, i) => {
                const on = i === 0 ? 1 - sel : sel
                return (
                  <div
                    key={label}
                    ref={el => {
                      trig.current[i] = el
                    }}
                    className={tabsTriggerVariants({ size: "md" })}
                    style={{ transition: "none", color: `color-mix(in oklab, var(--foreground) ${on * 100}%, var(--muted-foreground))` }}
                  >
                    {label}
                  </div>
                )
              })}
            </div>
            <div className="figures relative inline-flex whitespace-pre text-6xl font-strong text-foreground" aria-hidden>
              <span ref={probe} className="invisible absolute">0</span>
              <span>$</span>
              {[2, 1, 0].map((place, j) => {
                const to = TO[TO.length - 1 - place]
                const from = FROM[FROM.length - 1 - place]
                const s = t - CHANGE - j * STAGGER
                if (from === undefined) {
                  const g = spring(s, GROW)
                  return (
                    <span key={place} className="inline-grid overflow-clip" style={{ width: (m?.digit ?? 0) * g, opacity: ease.enter(progress(s, 0, 0.2)) }}>
                      <span className="col-start-1 row-start-1">{to}</span>
                    </span>
                  )
                }
                if (from === to) return <span key={place}>{to}</span>
                // One spring moves both glyphs a line apart, so they stay locked and never overlap; opacity crosses over quickly.
                const r = spring(s, ROLL)
                const x = progress(s, 0, 0.09)
                return (
                  <span key={place} className="inline-grid overflow-clip">
                    <span className="col-start-1 row-start-1" style={{ transform: `translateY(${-r * 100}%)`, opacity: 1 - x }}>
                      {from}
                    </span>
                    <span className="col-start-1 row-start-1" style={{ transform: `translateY(${(1 - r) * 100}%)`, opacity: x }}>
                      {to}
                    </span>
                  </span>
                )
              })}
            </div>
          </Card>
          {m && <Pointer x={px} y={py} k={K} press={t - SWITCH} opacity={1 - progress(t, 0.72, 0.2)} />}
        </div>
      </CenterBox>
    </MacroFrame>
  )
}
