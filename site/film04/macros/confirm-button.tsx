"use client"

import { useLayoutEffect, useRef, useState, type CSSProperties } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ease, lerp, progress, spring } from "@/site/film/clock"
import { layoutOf } from "./layout"
import { ContentBox, MacroFrame, Pointer, SPRING, TIER, drift, unitOf, type Anchors, type ContentProps, type MacroContent, type MacroDef, type MacroProps, type PresetId, type Scheme } from "./kit"

// s2 macro 3, 5.0-6.5, Poster light: an invoice row with the danger Delete ConfirmButton at its end, clicked, confirmed, collapsed.
// The markup is components/ui/confirm-button.tsx's, class for class (its Button, its question row, its end-hugging faces), with the
// motion value that component hands to Motion and to CSS transitions computed from the film clock instead, slowed 2x:
//   0.26-0.30  pointer arrives and presses Delete (the button's own press: the fill darkens, the edge spread collapses)
//   0.30       click: the control widens on the moderate spring to the question's width, the Delete face leaves on the fast exit (0.12)
//              while the question face arrives on the moderate enter (0.32). Both hug the end edge, so Confirm lands where Delete was
//   0.50-0.85  the pointer settles from Delete onto Confirm (the same spot, on the danger fill, never across "Delete?")
//   0.91-0.95  press Confirm; 0.95-1.25 loading: Confirm shows the button's spinner (turning at 2.5x), Cancel is disabled
//   1.25-1.49  onConfirm resolves: the width collapses on the moderate exit tween (0.24, ease-exit), the question leaves on the fast
//              exit and the Delete face returns on the moderate enter
// The invoice id and amount stack (the docs row sets them inline) so the open question has room beside them at this zoom.
// Not driven by the clock in the original, so overridden here: the Button's hover/press fill (CSS transitions) and its looping spinner.
const PRESET: PresetId = "poster"
const SCHEME: Scheme = "light"
const K = 3.8

const DOWN_OPEN = 0.26
const OPEN = 0.3
const DOWN_CONFIRM = 0.91
const CONFIRM = 0.95
const DONE = 1.25
const GAP = 12
const SPIN_RATE = 2.5

// The Button's fill is a CSS transition on hover and press and its spinner a CSS loop: neither can be pinned to the film clock, so
// the fill follows --h / --press (the same tokens the Button's own hover and active states mix) and the spinner is paused on --spin.
const CSS = `
[data-fx="danger"] > span:first-child {
  transition: none;
  --btn-bg: color-mix(in oklab, color-mix(in oklab, var(--danger), var(--danger-hover) calc(var(--h) * 100%)), var(--danger-active) calc(var(--press) * 100%));
  box-shadow: 0 0 0 calc(var(--btn-edge, 1px) * (1 - var(--press))) var(--btn-bg);
}
[data-fx] path { animation-play-state: paused; animation-delay: calc(var(--spin) * -1s); }
`

type Geo = { natural: number; end: number; mid: number; trigW: number; trigH: number; rowW: number; confW: number }

/** The button's :active fill: down on the fast tier (0.16), back out on the moderate tier (0.32). */
function press(t: number, down: number, up: number) {
  const v = ease.enter(progress(t, down, TIER.fast.enter))
  return t > up ? v * (1 - ease.enter(progress(t, up, TIER.moderate.enter))) : v
}

/** The pointer is counter-scaled to a constant size on the frame; past zoom 6 it grows with the zoom (up to 2.2x) so it still reads against a close-up. */
const pointerK = (zoom: number) => zoom / Math.max(1, Math.min(2.2, zoom / 6))

export const size = { w: 400, h: 44 }

export function Content({ t, preset = PRESET, scheme = SCHEME, zoom }: ContentProps) {
  const unit = useRef<HTMLDivElement>(null)
  const left = useRef<HTMLSpanElement>(null)
  const box = useRef<HTMLDivElement>(null)
  const trig = useRef<HTMLButtonElement>(null)
  const row = useRef<HTMLDivElement>(null)
  const conf = useRef<HTMLButtonElement>(null)
  const [g, setG] = useState<Geo | null>(null)
  // Widths come from the laid-out row, in component px (the box is CSS-zoomed). The question sits out of flow, so none of them move with t.
  useLayoutEffect(() => {
    const u = unitOf(unit.current!)
    const rowW = row.current!.offsetWidth / u
    // The row is as wide as the invoice text plus the open question, so the subject is the same share of the frame in every preset.
    const natural = left.current!.offsetWidth / u + GAP + rowW
    setG({
      natural,
      end: natural,
      mid: box.current!.offsetHeight / u / 2,
      trigW: trig.current!.offsetWidth / u,
      trigH: trig.current!.offsetHeight / u,
      rowW,
      confW: conf.current!.offsetWidth / u,
    })
  }, [preset, scheme])

  const asking = t >= OPEN && t < DONE
  const pending = t >= CONFIRM && t < DONE
  const open = spring(t - OPEN, SPRING.moderate)
  const closing = ease.exit(progress(t, DONE, TIER.moderate.exit))
  const width = g ? (t < DONE ? lerp(g.trigW, g.rowW, open) : lerp(g.rowW, g.trigW, closing)) : undefined
  const moving = (t >= OPEN && open < 0.995) || (t >= DONE && t < DONE + TIER.moderate.exit + 0.02)

  // The two faces: the one leaving takes the fast exit (0.12), the one arriving the moderate enter (0.32).
  const trigOpacity = t < OPEN ? 1 : t < DONE ? 1 - ease.exit(progress(t, OPEN, TIER.fast.exit)) : ease.enter(progress(t, DONE, TIER.moderate.enter))
  const rowOpacity = t < DONE ? ease.enter(progress(t, OPEN, TIER.moderate.enter)) : 1 - ease.exit(progress(t, DONE, TIER.fast.exit))

  const trigVars = { "--h": ease.enter(progress(t, 0.1, TIER.moderate.enter)), "--press": press(t, DOWN_OPEN, OPEN) }
  // Confirm is hovered from the moment it lands under the pointer; the pending state disables it, so hover and press ease out together.
  const confirmIn = ease.enter(progress(t, OPEN + 0.1, TIER.moderate.enter))
  const confVars = { "--h": confirmIn * (1 - ease.enter(progress(t, CONFIRM, TIER.moderate.enter))), "--press": press(t, DOWN_CONFIRM, CONFIRM), "--spin": Math.max(0, t - CONFIRM) * SPIN_RATE }

  // The pointer rests on the lower half of the button so the dot never sits on a label.
  const dy = g ? g.mid + g.trigH * 0.34 : 0
  const delX = g ? g.end - g.trigW / 2 : 0
  const confX = g ? g.end - 2 - g.confW / 2 : 0
  const arrive = ease.out(progress(t, 0, DOWN_OPEN))
  const settle = ease.inOut(progress(t, 0.5, 0.35))
  const away = ease.out(progress(t, 1.05, 0.3)) // the pointer leaves once Confirm is pressed, so the spinner is read on its own
  const px = lerp(delX + 40, delX, arrive) + (confX - delX) * settle + 25 * away
  const py = lerp(dy + 95, dy, arrive) + 45 * away

  return (
    <ContentBox w={size.w} h={size.h}>
        <style>{CSS}</style>
        <div ref={box} className="relative mx-auto flex h-full items-center justify-between gap-3" style={{ width: g?.natural, opacity: g ? 1 : 0 }}>
          <div ref={unit} className="invisible absolute" style={{ width: 100, height: 0 }} />
          <span ref={left} className="grid text-sm leading-snug">
            <span className="figures">2041</span>
            <span className="figures text-muted-foreground">$1,280.00</span>
          </span>
          <span data-confirm-button="" className={cn("relative inline-flex justify-end align-middle rounded-control", moving && "overflow-clip")} style={{ width }}>
            <Button
              ref={trig}
              data-fx="danger"
              variant="danger"
              size="sm"
              inert={asking}
              style={{ ...(trigVars as CSSProperties), opacity: trigOpacity, transition: "none" }}
            >
              Delete
            </Button>
            <div
              ref={row}
              role="group"
              aria-label="Delete?"
              inert={!asking}
              className="absolute inset-y-0 end-0 flex w-max items-center gap-2 rounded-control bg-danger-subtle p-0.5 pl-pad-control-md text-sm text-danger-subtle-foreground"
              style={{ opacity: rowOpacity, transition: "none" }}
            >
              <span className="font-label whitespace-nowrap">Delete?</span>
              <Button variant="outline" size="sm" className="h-full" disabled={pending}>
                Cancel
              </Button>
              <Button ref={conf} data-fx="danger" variant="danger" size="sm" className="h-full" loading={pending} style={confVars as CSSProperties}>
                Delete
              </Button>
            </div>
          </span>
          {g && <Pointer x={px} y={py} k={pointerK(zoom)} press={t < 0.71 ? t - DOWN_OPEN : t - DOWN_CONFIRM} opacity={ease.out(progress(t, 0, 0.1)) * (1 - progress(t, 1.1, 0.2))} />}
        </div>
    </ContentBox>
  )
}

/**
 * Anchors in component px. `trigger` is the Delete button at rest, `confirm` the Delete inside the question (it lands where the trigger was, both hugging the
 * end edge), `question` the whole open surface and `questionLabel` its "Delete?"; `control` is the widening box itself, its end edge fixed.
 */
export function anchors(t: number, preset: PresetId = PRESET): Anchors {
  const r = layoutOf("confirm-button", preset).rects
  const open = spring(t - OPEN, SPRING.moderate)
  const closing = ease.exit(progress(t, DONE, TIER.moderate.exit))
  const width = t < DONE ? lerp(r.trigger.w, r.question.w, open) : lerp(r.question.w, r.trigger.w, closing)
  const end = r.control.x + r.control.w / 2
  return {
    row: r.row, invoice: r.invoice, trigger: r.trigger, question: r.question, questionLabel: r.questionLabel, cancel: r.cancel, confirm: r.confirm,
    control: { x: end - width / 2, y: r.control.y, w: width, h: r.control.h },
  }
}

/** Macro seconds of the beats: the first click (opens the question), the confirming click, and the answer (the question collapses). */
export const EVENTS = { open: OPEN, confirm: CONFIRM, done: DONE }

const content: MacroContent = { size, Content, anchors, events: EVENTS }

function ConfirmButtonMacro({ t, preset = PRESET, scheme = SCHEME }: MacroProps) {
  return <MacroFrame content={content} preset={preset} scheme={scheme} t={t} zoom={K} cam={drift(t, { x: 10 }, { x: -10 })} caption="ConfirmButton" />
}

export const macro: MacroDef = { slug: "confirm-button", name: "ConfirmButton", preset: PRESET, scheme: SCHEME, Component: ConfirmButtonMacro, content }
