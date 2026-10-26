"use client"

import { useLayoutEffect, useRef, useState, type CSSProperties } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { bezier, clamp, ease, progress, spring } from "@/site/film/clock"
import { layoutOf } from "./layout"
import { ContentBox, MacroFrame, Pointer, SPRING, TIER, drift, unitOf, type Anchor, type Anchors, type ContentProps, type MacroContent, type MacroDef, type MacroProps, type PresetId, type Scheme } from "./kit"

// s2 macro 8, 12.5-14.0, Folio dark. Checklist with moveCompletedToEnd: the check, then the strike, then the glide, in the component's own order.
//   0.00-0.25  the pointer arrives from the lower left at the first checkbox; the border warms to muted-foreground on the way (hover, fast).
//   0.25       click. The box fills primary and its check draws (fast, 0.16).
//   0.41       the strike draws across "Verify your email" left to right on the moderate spring (0.32) and the label goes muted with it:
//              one fast tier after the click, as `motion-safe:group-data-checked/item:delay-(--duration-fast)` does in the component.
//   0.73       the strike is done (fast + moderate, the component's strikeMs at 2x): the item glides to the end of the list on spring.moderate
//              (0.32) while the other two rise into its place. Hold to the cut.
// The list is the component's own markup (ul, li, label, the real Checkbox, the data-strike span, same classes), laid out in the CenterBox zoom.
// The glide crosses the finished item with the two that rise, so it passes under them: each li has the scene's background and the finished one sits
// below, which hides it behind a neighbour for those frames instead of overprinting two labels; it fades through the crossing so the edge of the li in front never cuts its text.
// Not the component itself: its strike and fill are CSS transitions and its glide is Motion layout, neither of which the film clock can pin,
// and its reorder runs on a setTimeout. So the colours, draws and offsets are set from the clock and the transitions are off.
const PRESET: PresetId = "folio"
const SCHEME: Scheme = "dark"
const K = 6
const LABELS = ["Verify your email", "Add a payment method", "Invite your team"]
const CLICK = 0.25
const STRIKE = CLICK + TIER.fast.enter
const GLIDE = CLICK + TIER.fast.enter + TIER.moderate.enter
// transition-colors without a named ease is Tailwind's default curve
const standard = bezier(0.4, 0, 0.2, 1)

// Copied from components/ui/checklist.tsx (not exported there). Only the resting part: the checked variants are driven inline.
const strike = "bg-[linear-gradient(currentColor,currentColor)] bg-no-repeat [background-position:0_58%] [background-size:0%_var(--border-width)]"

type Measure = { pitch: number; x: number; y: number }

// At extreme close-ups the 34px dot would be a speck against a coin-sized control, so the pointer grows with the zoom, up to 3x from zoom 6 to 18.
const pointerK = (zoom: number) => zoom / Math.min(3, Math.max(1, zoom / 6))

export const size = { w: 260, h: 110 }

export function Content({ t, preset = PRESET, scheme = SCHEME, zoom }: ContentProps) {
  const probe = useRef<HTMLDivElement>(null)
  const list = useRef<HTMLUListElement>(null)
  const [m, setM] = useState<Measure | null>(null)
  useLayoutEffect(() => {
    const u = unitOf(probe.current!)
    const lis = list.current!.querySelectorAll<HTMLElement>("li")
    const box = lis[0].querySelector<HTMLElement>("[role=checkbox]")!
    setM({ pitch: (lis[1].offsetTop - lis[0].offsetTop) / u, x: (box.offsetLeft + box.offsetWidth / 2) / u, y: (box.offsetTop + box.offsetHeight / 2) / u })
  }, [preset, scheme])

  const pitch = m?.pitch ?? 30
  const fill = standard(progress(t, CLICK, TIER.fast.enter))
  const hover = standard(progress(t, CLICK - 0.14, TIER.fast.enter))
  const draw = ease.enter(progress(t, CLICK, TIER.fast.enter))
  const line = spring(t - STRIKE, SPRING.moderate)
  const glide = spring(t - GLIDE, SPRING.moderate)
  // Item 0 goes to the end (two rows down), the other two take one row up.
  const dy = [2 * pitch * glide, -pitch * glide, -pitch * glide]
  // While the finished item is behind a neighbour it also fades out and back in, so no sliver of it is cut by the edge of the li in front.
  const hidden = clamp(2.5 * Math.sin(Math.PI * progress(glide, 0.12, 0.76)))

  // Arrives from the lower left, outside the checkbox column, so it crosses no label; after the click it backs away before the glide.
  const arrive = ease.out(progress(t, 0, CLICK))
  const leave = ease.inOut(progress(t, CLICK + 0.2, 0.3))
  // The dot rests on the box's lower-right corner, not its centre: at close-up scale a centred dot would sit on the check as it draws.
  const px = m ? m.x + 6 - 70 * (1 - arrive) - 40 * leave : 0
  const py = m ? m.y + 7 + 90 * (1 - arrive) + 20 * leave : 0

  return (
    <ContentBox w={size.w} h={size.h}>
        <div className="flex h-full items-center justify-center">
          <div className="relative" style={{ opacity: m ? 1 : 0 }}>
            <div ref={probe} className="invisible absolute" style={{ width: 100, height: 0 }} />
            <ul ref={list} className="grid gap-2">
              {LABELS.map((label, i) => (
                <li
                  key={label}
                  data-checklist-item=""
                  className="group/item relative bg-background text-sm text-foreground [&_*]:transition-none! [&_svg_path:first-child]:[stroke-dashoffset:var(--draw)]!"
                  style={{ transform: `translateY(${dy[i]}px)`, zIndex: i === 0 ? 0 : 1, opacity: i === 0 ? 1 - hidden : 1, "--draw": i === 0 ? 1 - draw : 1 } as CSSProperties}
                >
                  <label className="flex w-fit cursor-pointer items-start gap-2">
                    <Checkbox
                      checked={i === 0 && t >= CLICK}
                      onCheckedChange={() => {}}
                      className="mt-0.5"
                      style={
                        i === 0
                          ? {
                              backgroundColor: `color-mix(in oklab, var(--primary) ${fill * 100}%, var(--surface))`,
                              borderColor: `color-mix(in oklab, var(--primary) ${fill * 100}%, color-mix(in oklab, var(--muted-foreground) ${hover * 100}%, var(--input)))`,
                            }
                          : undefined
                      }
                    />
                    <span className="min-w-0">
                      <span
                        data-strike=""
                        className={strike}
                        style={i === 0 ? { backgroundSize: `${line * 100}% var(--border-width)`, color: `color-mix(in oklab, var(--muted-foreground) ${line * 100}%, var(--foreground))` } : undefined}
                      >
                        {label}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            {m && <Pointer x={px} y={py} k={pointerK(zoom)} press={t - CLICK} opacity={1 - progress(t, CLICK + 0.3, 0.25)} />}
          </div>
        </div>
    </ContentBox>
  )
}

/**
 * Anchors in component px. The first item (`box`, `label`, `strike`) rides its glide to the end of the list, and the other two rise a row; `strike` is
 * the whole line, `strikeFront` the point where it is drawn to (its leading edge), both at the label's strike height.
 */
export function anchors(t: number, preset: PresetId = PRESET): Anchors {
  const { rects: r, bw } = layoutOf("checklist", preset)
  const pitch = r.item2.y - r.item1.y
  const glide = spring(t - GLIDE, SPRING.moderate)
  const dy = [2 * pitch * glide, -pitch * glide, -pitch * glide]
  const shift = (a: Anchor, d: number): Anchor => ({ ...a, y: a.y + d })
  const left = r.label1.x - r.label1.w / 2
  const y = r.label1.y - r.label1.h / 2 + (r.label1.h - bw) * 0.58 + bw / 2 + dy[0]
  const line = spring(t - STRIKE, SPRING.moderate)
  return {
    list: r.list, box: shift(r.box1, dy[0]), label: shift(r.label1, dy[0]),
    strike: { x: r.label1.x, y, w: r.label1.w, h: bw }, strikeFront: { x: left + r.label1.w * line, y },
    item1: shift(r.item1, dy[0]), item2: shift(r.item2, dy[1]), item3: shift(r.item3, dy[2]),
    label2: shift(r.label2, dy[1]), label3: shift(r.label3, dy[2]), box2: shift(r.box2, dy[1]), box3: shift(r.box3, dy[2]),
  }
}

/** Macro seconds of the beats: the click, the strike starting to draw, the glide starting. */
export const EVENTS = { click: CLICK, strike: STRIKE, glide: GLIDE }

const content: MacroContent = { size, Content, anchors, events: EVENTS }

function ChecklistMacro({ t, preset = PRESET, scheme = SCHEME }: MacroProps) {
  return <MacroFrame content={content} preset={preset} scheme={scheme} t={t} zoom={K} cam={drift(t)} caption="Checklist" />
}

export const macro: MacroDef = { slug: "checklist", name: "Checklist", preset: PRESET, scheme: SCHEME, Component: ChecklistMacro, content }
