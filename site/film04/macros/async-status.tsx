"use client"

import { Card } from "@/components/ui/card"
import { Heading } from "@/components/ui/heading"
import { Spinner } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ease, progress, spring } from "@/site/film/clock"
import { layoutOf } from "./layout"
import { ContentBox, MacroFrame, SPRING, TIER, drift, type Anchors, type ContentProps, type MacroContent, type MacroDef, type MacroProps, type PresetId, type Scheme } from "./kit"

// s2 macro 2, 3.5-5.0, Folio dark. AsyncStatus on its own spinner -> check -> label roll, every tier slowed 2x.
//   0.00-0.45  "Saving", the spinner turning (the one loop, on the clock: the real animation, paused at the clock's time)
//   0.45       state turns success. Spinner layer freezes and fades on the moderate exit (0.24); the check layer fades in on the moderate
//              enter (0.32) while its stroke draws on the moderate spring. The label rolls up a line: "Saving" leaves on the exit tween
//              (0.24) and fades on the fast exit (0.12) so it is clear before "Saved" is a third of the way up; "Saved" rises on the
//              moderate spring and fades in over 0.32. Hold from about 0.9 to the cut.
// The markup and classes are AsyncStatus's own (the layers, the draw, the rolling label); only the moving values come from `t`.
const PRESET: PresetId = "folio"
const SCHEME: Scheme = "dark"
const K = 5.8
const SUCCESS = 0.45
const SPIN_START = 1.6 // the loop's clock when the macro starts: its dash is longest around 2 s, so the turn reads while the state is pending

// AsyncStatus's classes, verbatim (components/ui/async-status.tsx); transitions are switched off inline, the clock drives them.
const layer = "col-start-1 row-start-1 flex opacity-0"
const draw = "[stroke-dasharray:1] [stroke-dashoffset:1]"
const mark = { pathLength: 1, stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round" } as const
// The Spinner's own CSS animation, pinned: paused with a negative delay shows it at that time, wherever the renderer jumps to.
const pinned = "[&_path]:[animation-play-state:paused] [&_path]:[animation-delay:var(--spin)]"

export const size = { w: 200, h: 134 }

/** Options (a shot's choice, 0 hides, a fraction fades): `heading` the "Q3 report" title, `card` the card's own surface and border, `label` the word. A billboard shows the status alone; the montage only its check. Layout is untouched, so the anchors hold. */
export function Content({ t, options }: ContentProps) {
  const shown = (key: string) => Number(options?.[key] ?? 1) !== 0
  const labelOpacity = Number(options?.label ?? 1)
  const s = t - SUCCESS
  const spinning = Math.min(t, SUCCESS) + SPIN_START // the real layer pauses its spinner the moment it leaves pending
  const spinOpacity = s < 0 ? 1 : 1 - ease.exit(progress(s, 0, TIER.moderate.exit))
  const checkOpacity = ease.enter(progress(s, 0, TIER.moderate.enter))
  const drawn = spring(s, SPRING.moderate)

  const outY = -ease.exit(progress(s, 0, TIER.moderate.exit)) * 100
  const outOpacity = 1 - ease.exit(progress(s, 0, TIER.fast.exit))
  const inY = (1 - spring(s, SPRING.moderate)) * 100
  const inOpacity = ease.enter(progress(s, 0, TIER.moderate.enter))

  return (
    <ContentBox w={size.w} h={size.h}>
        <div className="flex h-full items-center">
          <Card className={cn("w-full gap-3", !shown("card") && "border-transparent bg-transparent shadow-none")}>
            <Heading level={2} size="lg" className={cn(!shown("heading") && "invisible")}>
              Q3 report
            </Heading>
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <span className="grid size-4 place-items-center">
                <span className={cn(layer, pinned)} style={{ opacity: spinOpacity, transition: "none", ["--spin" as string]: `${-spinning}s` }}>
                  <Spinner className="size-4" />
                </span>
                <span className={cn("group/layer", layer)} style={{ opacity: checkOpacity, transition: "none" }}>
                  <svg viewBox="0 0 16 16" fill="none" className="size-4">
                    <path d="M3 8.5 6.5 12 13 4.5" className={draw} style={{ strokeDashoffset: 1 - drawn, transition: "none" }} {...mark} />
                  </svg>
                </span>
              </span>
              <span className="relative inline-grid overflow-y-clip" style={{ opacity: labelOpacity }}>
                {s < TIER.moderate.exit && (
                  <span className="col-start-1 row-start-1 whitespace-nowrap" style={{ transform: `translateY(${outY}%)`, opacity: outOpacity }}>
                    Saving
                  </span>
                )}
                {s >= 0 && (
                  <span className="col-start-1 row-start-1 whitespace-nowrap" style={{ transform: `translateY(${inY}%)`, opacity: inOpacity }}>
                    Saved
                  </span>
                )}
              </span>
            </span>
          </Card>
        </div>
    </ContentBox>
  )
}

/** Anchors in component px. The spinner and the check share a spot; the label keeps its left edge and takes the width of the word on show (both while one rolls out and the other in). */
export function anchors(t: number, preset: PresetId = PRESET): Anchors {
  const { card, title, spinner, line, labelSaving, labelSaved } = layoutOf("async-status", preset).rects
  const s = t - SUCCESS
  const w = s < 0 ? labelSaving.w : s < TIER.moderate.exit ? Math.max(labelSaving.w, labelSaved.w) : labelSaved.w
  const left = labelSaving.x - labelSaving.w / 2
  return { card, title, line, spinner, check: spinner, label: { x: left + w / 2, y: labelSaving.y, w, h: labelSaving.h } }
}

/** Macro seconds of the beats. */
export const EVENTS = { success: SUCCESS }

const content: MacroContent = { size, Content, anchors, events: EVENTS }

function AsyncStatusMacro({ t, preset = PRESET, scheme = SCHEME }: MacroProps) {
  return <MacroFrame content={content} preset={preset} scheme={scheme} t={t} zoom={K} cam={drift(t, { x: 40, y: 10 }, { x: -30, y: -10 })} caption="AsyncStatus" />
}

export const macro: MacroDef = { slug: "async-status", name: "AsyncStatus", preset: PRESET, scheme: SCHEME, Component: AsyncStatusMacro, content }
