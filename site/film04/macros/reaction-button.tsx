"use client"

import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react"
import { Heart, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ease, lerp, progress, spring } from "@/site/film/clock"
import { layoutOf, type Rect } from "./layout"
import { ContentBox, MacroFrame, Pointer, SPRING, TIER, drift, unitOf, type Anchor, type Anchors, type ContentOptions, type ContentProps, type MacroContent, type MacroDef, type MacroProps, type PresetId, type Scheme } from "./kit"

// s2 macro 4, 6.5-8.0, Ledger dark: two ReactionButtons, a heart at 12 and a star at 99, each pressed once.
// The markup is components/ui/reaction-button.tsx's (its outline Button, its data-reaction-icon span, AnimatedNumber's digit layout),
// with the motion computed from the film clock, slowed 2x:
//   0.26-0.30  pointer arrives under the heart and presses it (the button's own press fill)
//   0.30       press: the icon fill fades in (fast, 0.16) while the icon settles 0.85 -> 1 on the fast spring; the count rolls 12 -> 13
//              on the moderate spring: only the 2 rolls up a line, the 1 stays
//   0.50-0.80  the pointer glides under the buttons to the star, never across a count
//   0.81-0.85  press the star: the same fill and settle; 99 -> 100: both 9s roll up to 0 while the new 1 grows in width and fades in
// Not driven by the clock in the original, so overridden here: the Button's hover and press fill and its stroke-width hover, and the
// icon fill (all CSS transitions). A roll moves the old glyph out and the new one in on one spring, a line apart, so they never overprint.
const PRESET: PresetId = "ledger"
const SCHEME: Scheme = "dark"
const K = 6.4

const DOWN1 = 0.26
const PRESS1 = 0.3
const DOWN2 = 0.81
const PRESS2 = 0.85

// What the Button does on its own: hover tints the fill and thickens the stroke, :active collapses the edge spread. Following --h,
// --press and --fill puts that on the film clock.
const CSS = `
[data-fx="outline"] > span:first-child {
  transition: none;
  --btn-bg: color-mix(in oklab, color-mix(in oklab, var(--hover) calc(var(--h) * 100%), transparent), var(--active) calc(var(--press) * 100%));
  box-shadow: 0 0 0 calc(var(--btn-edge) * (1 - var(--press))) var(--input), inset 0 0 0 calc(var(--btn-edge) * var(--press)) var(--input);
}
[data-fx="outline"] svg { transition: none !important; stroke-width: calc(1.5 + 0.5 * var(--h)) !important; fill: currentColor !important; fill-opacity: var(--fill); }
`

type Geo = { digit: number; heart: { x: number; y: number }; star: { x: number; y: number } }

/** AnimatedNumber's glyphs for one count change at `at`: unchanged places stay, changed ones roll up a line, an added place grows in. */
function Count({ from, to, t, at, digit }: { from: number; to: number; t: number; at: number; digit: number }) {
  const a = String(from)
  const b = String(to)
  const s = t - at
  return (
    <span className="figures relative inline-flex whitespace-pre" aria-hidden>
      {[...b].map((ch, j) => {
        const place = b.length - 1 - j
        const old = a[a.length - 1 - place]
        if (old === ch) return <span key={place}>{ch}</span>
        if (old === undefined) {
          return (
            <span key={place} className="inline-grid overflow-clip" style={{ width: digit * spring(s, SPRING.moderate), opacity: ease.enter(progress(s, 0, TIER.moderate.enter)) }}>
              <span className="col-start-1 row-start-1">{ch}</span>
            </span>
          )
        }
        const r = spring(s, SPRING.moderate)
        const x = progress(s, 0, 0.09)
        return (
          <span key={place} className="inline-grid overflow-clip">
            <span className="col-start-1 row-start-1" style={{ transform: `translateY(${-r * 100}%)`, opacity: 1 - x }}>
              {old}
            </span>
            <span className="col-start-1 row-start-1" style={{ transform: `translateY(${(1 - r) * 100}%)`, opacity: x }}>
              {ch}
            </span>
          </span>
        )
      })}
    </span>
  )
}

type ReactionProps = { icon: ReactNode; from: number; at: number; down: number; leave?: number; arrive: number; t: number; digit: number }

/** One ReactionButton in the state of this moment. The classes are the component's; hover leaves when the pointer does (`leave`). */
function Reaction({ icon, from, at, down, leave, arrive, t, digit }: ReactionProps) {
  const hover = ease.enter(progress(t, arrive, TIER.moderate.enter)) * (leave === undefined ? 1 : 1 - ease.enter(progress(t, leave, TIER.moderate.enter)))
  const fill = ease.enter(progress(t, at, TIER.fast.enter))
  // The :active fill is down on the fast tier and released on the moderate one when the click lands.
  const dip = ease.enter(progress(t, down, TIER.fast.enter)) * (t > at ? 1 - ease.enter(progress(t, at, TIER.moderate.enter)) : 1)
  const vars = { "--h": hover, "--press": dip, "--fill": fill }
  return (
    <Button data-fx="outline" variant="outline" aria-pressed={t >= at} style={vars as CSSProperties}>
      <span data-reaction-icon="" className="inline-flex" style={{ transform: `scale(${lerp(0.85, 1, spring(t - at, SPRING.fast))})` }}>
        {icon}
      </span>
      <Count from={from} to={from + 1} t={t} at={at} digit={digit} />
    </Button>
  )
}

/** The pointer is counter-scaled to a constant size on the frame; past zoom 6 it grows with the zoom (up to 2.2x) so it still reads against a close-up. */
const pointerK = (zoom: number) => zoom / Math.max(1, Math.min(2.2, zoom / 6))

export const size = { w: 190, h: 44 }

export function Content({ t, preset = PRESET, scheme = SCHEME, zoom, options }: ContentProps) {
  // Option `first`: "star" presses the star (99 to 100) at the first beat and the heart (12 to 13) at the second; v1 played the heart first.
  const starFirst = options?.first === "star"
  const heartBeat = starFirst ? { at: PRESS2, down: DOWN2, arrive: 0.7, leave: undefined } : { at: PRESS1, down: DOWN1, arrive: 0.12, leave: 0.55 }
  const starBeat = starFirst ? { at: PRESS1, down: DOWN1, arrive: 0.12, leave: 0.55 } : { at: PRESS2, down: DOWN2, arrive: 0.7, leave: undefined }
  const unit = useRef<HTMLDivElement>(null)
  const ghost = useRef<HTMLDivElement>(null)
  const [g, setG] = useState<Geo | null>(null)
  // A hidden copy of the resting row (12 and 99) gives the pointer its targets and the width of one digit, whatever t is when this mounts.
  useLayoutEffect(() => {
    const u = unitOf(unit.current!)
    const [heart, star] = [...ghost.current!.querySelectorAll<HTMLElement>("button")]
    const centre = (el: HTMLElement) => ({ x: (el.offsetLeft + el.offsetWidth / 2) / u, y: (el.offsetTop + el.offsetHeight / 2) / u })
    setG({ digit: ghost.current!.querySelector<HTMLElement>("[data-digit]")!.offsetWidth / u, heart: centre(heart), star: centre(star) })
  }, [preset, scheme])

  // The pointer rests on the lower edge of the button, clear of the icon and the count, and travels below the row between the two.
  const low = 14.5
  // The star's count gaining a digit slides the heart left by half of it; its own centre stays.
  const shift = g ? (g.digit * spring(t - starBeat.at, SPRING.moderate)) / 2 : 0
  const h = g ? { x: g.heart.x - shift, y: g.heart.y + low } : { x: 0, y: 0 }
  const s = g ? { x: g.star.x, y: g.star.y + low } : { x: 0, y: 0 }
  const [a, b] = starFirst ? [s, h] : [h, s]
  const arrive = ease.out(progress(t, 0, DOWN1))
  const glide = ease.inOut(progress(t, 0.5, 0.3))
  const px = t < 0.5 ? lerp(a.x + 60, a.x, arrive) : lerp(a.x, b.x, glide)
  const py = t < 0.5 ? lerp(a.y + 60, a.y, arrive) : lerp(a.y, b.y, glide) + 13 * Math.sin(Math.PI * glide)

  return (
    <ContentBox w={size.w} h={size.h}>
        <style>{CSS}</style>
        <div className="relative flex h-full items-center justify-center gap-3" style={{ opacity: g ? 1 : 0 }}>
          <div ref={unit} className="invisible absolute" style={{ width: 100, height: 0 }} />
          <div ref={ghost} aria-hidden className="invisible absolute inset-0 flex items-center justify-center gap-3">
            <Button variant="outline">
              <Heart />
              <span className="figures">12</span>
            </Button>
            <Button variant="outline">
              <Star />
              <span className="figures">99</span>
            </Button>
            <span data-digit className="figures absolute">
              0
            </span>
          </div>
          <Reaction icon={<Heart />} from={12} {...heartBeat} t={t} digit={g?.digit ?? 0} />
          <Reaction icon={<Star />} from={99} {...starBeat} t={t} digit={g?.digit ?? 0} />
          {g && <Pointer x={px} y={py} k={pointerK(zoom)} press={t < 0.72 ? t - DOWN1 : t - DOWN2} opacity={ease.out(progress(t, 0, 0.1)) * (1 - progress(t, 1.3, 0.2))} />}
        </div>
    </ContentBox>
  )
}

/**
 * Anchors in component px. The row is centred, so when the star's count gains its third digit (99 to 100) the heart slides left by half a digit and
 * the star's button grows by a whole digit about its centre; the counts and icons follow their buttons.
 */
export function anchors(t: number, preset: PresetId = PRESET, options?: ContentOptions): Anchors {
  const r = layoutOf("reaction-button", preset).rects
  const grow = r.digit.w * spring(t - (options?.first === "star" ? PRESS1 : PRESS2), SPRING.moderate)
  const left = <A extends Anchor>(a: A): A => ({ ...a, x: a.x - grow / 2 })
  const wider = (a: Rect): Rect => ({ ...a, w: a.w + grow })
  return {
    heart: left(r.heart), heartIcon: left(r.heartIcon), heartCount: left(r.heartCount),
    star: wider(r.star), starIcon: left(r.starIcon), starCount: wider(r.starCount),
    digit: r.digit,
  }
}

/** Macro seconds of the beats: the first press and the second. v1 presses the heart (12 to 13) then the star (99 to 100); option `first: "star"` swaps them. */
export const EVENTS = { first: PRESS1, second: PRESS2 }

const content: MacroContent = { size, Content, anchors, events: EVENTS }

function ReactionButtonMacro({ t, preset = PRESET, scheme = SCHEME }: MacroProps) {
  return <MacroFrame content={content} preset={preset} scheme={scheme} t={t} zoom={K} cam={drift(t)} caption="ReactionButton" />
}

export const macro: MacroDef = { slug: "reaction-button", name: "ReactionButton", preset: PRESET, scheme: SCHEME, Component: ReactionButtonMacro, content }
