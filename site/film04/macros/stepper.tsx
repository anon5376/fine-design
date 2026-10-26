"use client"

import { useLayoutEffect, useRef, useState, type CSSProperties } from "react"
import { Button } from "@/components/ui/button"
import { Step, Stepper } from "@/components/ui/stepper"
import { bezier, ease, progress, spring } from "@/site/film/clock"
import { layoutOf } from "./layout"
import { ContentBox, MacroFrame, Pointer, SPRING, TIER, drift, unitOf, type Anchors, type ContentProps, type MacroContent, type MacroDef, type MacroProps, type PresetId, type Scheme } from "./kit"

// s2 macro 9, 14.0-15.5, Poster light. Stepper (the real Stepper and Step, vertical) with its Continue button, two clicks.
//   0.00-0.25  the pointer arrives at Continue from the lower right.
//   0.25       click 1, the button presses. Shipping completes over the fast tier (0.16): the marker fills primary, its number leaves in the first half
//              and the check draws in the second (the component does both at once; slowed 2x the two would overprint for several frames).
//   0.41       one fast tier later the connector to Payment fills from its start edge (scaleY, moderate spring, 0.32) and the current ring travels
//              with it to Payment's marker (spring.moderate, delayed by the fast tier). Payment's number turns foreground.
//   0.85       click 2: the same, Payment to Review (check 0.85, connector and ring from 1.01). Hold to the cut.
// Vertical, with Continue beside the steps (as the docs' Onboarding example): four titles in a row cannot reach 56px at a width the wall's tiles can
// show (about 1250px of the frame), and in a column the ring travels along the connector without crossing a title.
// The Stepper and Steps are the component, rendered with `current` stepping at each click as in the docs example. What the clock sets, through
// the CSS variables below: the marker fill and check, the connector's scale and the ring. The component's own ring (a Motion layoutId) is hidden and
// replaced by a span with its classes, because Motion's layout animation cannot be pinned to the film clock; all CSS transitions are off.
const PRESET: PresetId = "poster"
const SCHEME: Scheme = "light"
const W = 260
const H = 170
const K = 5
const CLICKS = [0.25, 0.85]
const standard = bezier(0.4, 0, 0.2, 1)

// Scoped to this macro. A marker is the first span of the li's first span (the column that holds the marker and its connector); its number is the marker's first span.
const CSS = `
[data-film-stepper] * { transition: none !important; }
[data-film-stepper] [data-step-ring] { display: none !important; }
[data-film-stepper] li > span:first-child > span[aria-hidden]:first-child {
  background-color: color-mix(in oklab, var(--primary) calc(var(--mk) * 100%), var(--surface)) !important;
  border-color: color-mix(in oklab, var(--primary) calc(var(--mk) * 100%), color-mix(in oklab, var(--muted-foreground) 40%, transparent)) !important;
  color: color-mix(in oklab, var(--primary-foreground) calc(var(--mk) * 100%), color-mix(in oklab, var(--foreground) calc(var(--cur) * 100%), var(--muted-foreground))) !important;
}
[data-film-stepper] li > span:first-child > span[aria-hidden]:first-child > span:first-child { opacity: calc(1 - var(--num)) !important; }
[data-film-stepper] [data-step-check] { stroke-dashoffset: calc(1 - var(--draw)) !important; }
[data-film-stepper] [data-connector-fill] { scale: 1 var(--fill) !important; }
[data-film-press] > button > span[aria-hidden]:first-child {
  --btn-bg: color-mix(in oklab, var(--primary-active) calc(var(--press) * 100%), var(--primary)) !important;
  box-shadow: 0 0 0 calc(var(--btn-edge, 1px) * (1 - var(--press))) var(--btn-bg) !important;
}
`

/** How far the button is held down at t: in over the fast tier from each click, back out over the moderate tier once released (0.14 later). */
function pressed(t: number): number {
  return Math.max(
    ...CLICKS.map(c => {
      const release = c + 0.14
      const held = standard(progress(Math.min(t, release), c, TIER.fast.enter))
      return held * (1 - ease.out(progress(t, release, TIER.moderate.enter)))
    }),
  )
}

type Rect = { x: number; y: number; w: number; h: number }
type Measure = { markers: Rect[]; button: Rect }

// At extreme close-ups the 34px dot would be a speck against a coin-sized control, so the pointer grows with the zoom, up to 3x from zoom 6 to 18.
const pointerK = (zoom: number) => zoom / Math.min(3, Math.max(1, zoom / 6))

export const size = { w: W, h: H }

export function Content({ t, preset = PRESET, scheme = SCHEME, zoom }: ContentProps) {
  const probe = useRef<HTMLDivElement>(null)
  const root = useRef<HTMLDivElement>(null)
  const btn = useRef<HTMLDivElement>(null)
  const [m, setM] = useState<Measure | null>(null)
  useLayoutEffect(() => {
    const u = unitOf(probe.current!)
    const rect = (el: HTMLElement): Rect => ({ x: el.offsetLeft / u, y: el.offsetTop / u, w: el.offsetWidth / u, h: el.offsetHeight / u })
    const markers = [...root.current!.querySelectorAll<HTMLElement>("li > span:first-child > span[aria-hidden]:first-child")].map(rect)
    setM({ markers, button: rect(btn.current!.querySelector("button")!) })
  }, [preset, scheme])

  // `current` steps at each click, like the docs example's Continue.
  const current = t < CLICKS[0] ? 1 : t < CLICKS[1] ? 2 : 3
  // Per step, the time its completion starts (a step is completed by the click that leaves it), and when it becomes current.
  const doneAt = [-1, CLICKS[0], CLICKS[1], 99]
  const curAt = [-1, -1, CLICKS[0], CLICKS[1]]
  const vars = (i: number): CSSProperties =>
    ({
      "--mk": i === 0 ? 1 : standard(progress(t, doneAt[i], TIER.fast.enter)),
      // The number leaves in the first half of the fast tier and the check draws in the second, so "2" and the check are never both legible.
      "--num": i === 0 ? 1 : ease.out(progress(t, doneAt[i], TIER.fast.enter / 2)),
      "--draw": i === 0 ? 1 : ease.enter(progress(t, doneAt[i] + TIER.fast.enter / 4, TIER.fast.enter * 0.75)),
      "--cur": i <= 1 ? 1 : standard(progress(t, curAt[i], TIER.fast.enter)),
      // The connector follows its step's completion by one fast tier.
      "--fill": i === 0 ? 1 : spring(t - doneAt[i] - TIER.fast.enter, SPRING.moderate),
    }) as CSSProperties

  // The ring leaves a marker one fast tier after the click and lands on the next on the moderate spring.
  const mk = m?.markers ?? []
  const hop = [spring(t - CLICKS[0] - TIER.fast.enter, SPRING.moderate), spring(t - CLICKS[1] - TIER.fast.enter, SPRING.moderate)]
  const at = (key: "x" | "y" | "w" | "h") => (mk.length ? mk[1][key] + (mk[2][key] - mk[1][key]) * hop[0] + (mk[3][key] - mk[2][key]) * hop[1] : 0)

  // Continue sits beside the steps; the dot comes from the lower right and rests on the button's lower edge, half over the fill and half over the page, so it shows on the ink button as well as the magenta one, and clear of the label.
  const b = m?.button
  const arrive = ease.out(progress(t, 0, CLICKS[0]))
  const px = b ? b.x + b.w - 24 + 120 * (1 - arrive) : 0
  const py = b ? b.y + b.h - 2 + 90 * (1 - arrive) : 0

  return (
    <ContentBox w={size.w} h={size.h}>
        <style>{CSS}</style>
        <div className="flex h-full items-center justify-center">
          <div ref={root} className="relative flex items-center gap-10" style={{ opacity: m ? 1 : 0 }}>
            <div ref={probe} className="invisible absolute" style={{ width: 100, height: 0 }} />
            <div data-film-stepper="">
              <Stepper current={current} orientation="vertical">
                <Step title="Cart" style={vars(0)} />
                <Step title="Shipping" style={vars(1)} />
                <Step title="Payment" style={vars(2)} />
                <Step title="Review" style={vars(3)} />
              </Stepper>
            </div>
            <div ref={btn} data-film-press="" style={{ "--press": pressed(t) } as CSSProperties}>
              <Button>Continue</Button>
            </div>
            {m && (
              <>
                <span
                  data-film-ring=""
                  aria-hidden
                  className="pointer-events-none absolute rounded-full border-line border-primary"
                  style={{ left: at("x"), top: at("y"), width: at("w"), height: at("h") }}
                />
                <Pointer x={px} y={py} k={pointerK(zoom)} press={t >= CLICKS[1] ? t - CLICKS[1] : t - CLICKS[0]} opacity={1} />
              </>
            )}
          </div>
        </div>
    </ContentBox>
  )
}

/**
 * Anchors in component px. The markers, titles and button are fixed; `ring` travels marker to marker with the clicks, `fill` is the front of the
 * connector that is filling (the one under the step just completed), `check` the marker whose check is drawing (or last drew).
 */
export function anchors(t: number, preset: PresetId = PRESET): Anchors {
  const r = layoutOf("stepper", preset).rects
  const hop = [spring(t - CLICKS[0] - TIER.fast.enter, SPRING.moderate), spring(t - CLICKS[1] - TIER.fast.enter, SPRING.moderate)]
  const at = (key: "x" | "y" | "w" | "h") => r.marker2[key] + (r.marker3[key] - r.marker2[key]) * hop[0] + (r.marker4[key] - r.marker3[key]) * hop[1]
  const second = t >= CLICKS[1]
  const conn = second ? r.conn3 : r.conn2
  const front = conn.y - conn.h / 2 + conn.h * spring(t - CLICKS[second ? 1 : 0] - TIER.fast.enter, SPRING.moderate)
  return {
    list: r.list, marker1: r.marker1, marker2: r.marker2, marker3: r.marker3, marker4: r.marker4,
    step1: r.step1, step2: r.step2, step3: r.step3, step4: r.step4, title1: r.title1, title2: r.title2, title3: r.title3, title4: r.title4,
    ring: { x: at("x"), y: at("y"), w: at("w"), h: at("h") },
    fill: { x: conn.x, y: front },
    check: second ? r.marker3 : r.marker2,
    continue: r.button,
  }
}

/** Macro seconds of the beats: the two Continue clicks. */
export const EVENTS = { click1: CLICKS[0], click2: CLICKS[1] }

const content: MacroContent = { size, Content, anchors, events: EVENTS }

function StepperMacro({ t, preset = PRESET, scheme = SCHEME }: MacroProps) {
  return <MacroFrame content={content} preset={preset} scheme={scheme} t={t} zoom={K} cam={drift(t)} caption="Stepper" />
}

export const macro: MacroDef = { slug: "stepper", name: "Stepper", preset: PRESET, scheme: SCHEME, Component: StepperMacro, content }
