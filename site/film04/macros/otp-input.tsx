"use client"

import type { CSSProperties } from "react"
import { Field, FieldLabel } from "@/components/ui/field"
import { ease, lerp, progress, spring } from "@/site/film/clock"
import { layoutOf } from "./layout"
import { ContentBox, MacroFrame, SPRING, TIER, drift, type Anchors, type ContentOptions, type ContentProps, type MacroContent, type MacroDef, type MacroProps, type PresetId, type Scheme } from "./kit"

// s2 macro 7, 11.0-12.5, Ledger light: FieldLabel "Verification code" and six OtpInput slots, the field focused from the first frame.
// 0.10-0.60  the digits 4 8 2 9 1 6 are typed, one every 0.1 s. Each rolls up into its slot (y from 100% on the moderate spring, opacity on the
//            moderate tween) and the one ring slides to the next slot (moderate spring, retargeted by each digit; the 6th digit leaves it on the
//            last slot, and the caret bar inside it goes with the last empty slot).
// 0.85-1.17  state turns success: the slot borders go to success left to right (fast, 0.08 s apart).
// The slots, ring and row are the component's own markup and classes; the digit roll, ring slide and border color are set from the film clock
// because Motion's springs and CSS transitions cannot be pinned by the renderer. Times are the tiers at 2x. No pointer: nothing is clicked.
const PRESET: PresetId = "ledger"
const SCHEME: Scheme = "light"
const K = 4.5
const W = 340
const H = 120

const CODE = "482916"
// `every` is the gap between digits (v1: 0.1 s); the success wave keeps its 0.25 s after the last digit.
const EVERY = 0.1
const TYPE_AT = (i: number, every = EVERY) => every * (i + 1)
// `wait` (option) is the pause after the last digit before the wave, default 0.25 s.
const successAt = (every = EVERY, wait = 0.25) => 0.6 + (every - EVERY) * CODE.length + wait

// The same strings as components/ui/otp-input.tsx, minus the transitions the clock replaces.
const slot = "grid h-control-lg w-control-md shrink-0 place-items-center overflow-clip rounded-control border-line border-input bg-surface font-label figures text-lg text-foreground"
const caret = "pointer-events-none absolute inset-y-0 left-0 w-control-md rounded-control border-line border-ring focus-ring outline-offset-0"

/** Where the ring is at t: it chases the active slot, and each digit retargets it from wherever it has got to (a CSS transition's restart). */
function ringAt(t: number, every = EVERY): number {
  let from = 0
  let to = 0
  let start = 0
  const at = (s: number) => lerp(from, to, spring(s - start, SPRING.moderate))
  for (let i = 0; i < CODE.length; i++) {
    const s = TYPE_AT(i, every)
    if (t < s) break
    const next = Math.min(i + 1, CODE.length - 1)
    if (next === to) continue
    from = at(s)
    to = next
    start = s
  }
  return at(t)
}

export const size = { w: W, h: H }

export function Content({ t, options }: ContentProps) {
  const every = Number(options?.every ?? EVERY)
  const SUCCESS = successAt(every, Number(options?.wait ?? 0.25))
  const typed = CODE.split("").filter((_, i) => TYPE_AT(i, every) <= t).length
  const bar = 1 - ease.enter(progress(t, TYPE_AT(CODE.length - 1, every), TIER.fast.enter))
  // Option `unfocus`: the code is submitted, so focus leaves and the ring fades as the last slot turns, which lets the wave end on a visible green slot.
  const ringOut = options?.unfocus ? ease.enter(progress(t - SUCCESS - (CODE.length - 1) * TIER.stagger, 0, TIER.fast.enter)) : 0

  return (
    <ContentBox w={size.w} h={size.h}>
        <div className="flex h-full items-center justify-center">
          <Field className="w-fit">
            <FieldLabel>Verification code</FieldLabel>
            <div data-otp="" className="group/otp relative inline-flex gap-2">
              {CODE.split("").map((digit, i) => {
                const s = t - TYPE_AT(i, every)
                const done = ease.enter(progress(t - SUCCESS - i * TIER.stagger, 0, TIER.fast.enter))
                return (
                  <span
                    key={i}
                    aria-hidden
                    data-otp-slot=""
                    data-state={done > 0 ? "success" : "idle"}
                    className={slot}
                    style={{ borderColor: `color-mix(in oklab, var(--input) ${(100 * (1 - done)).toFixed(1)}%, var(--success-subtle-foreground) ${(100 * done).toFixed(1)}%)` }}
                  >
                    {s >= 0 && (
                      <span
                        className="col-start-1 row-start-1"
                        style={{ transform: `translateY(${lerp(100, 0, spring(s, SPRING.moderate))}%)`, opacity: ease.enter(progress(s, 0, TIER.moderate.enter)) }}
                      >
                        {digit}
                      </span>
                    )}
                  </span>
                )
              })}
              <span
                aria-hidden
                data-otp-caret=""
                data-empty={typed < CODE.length ? "" : undefined}
                style={{ translate: `calc(${ringAt(t, every).toFixed(4)} * (var(--control-md) + 0.5rem)) 0`, opacity: 1 - ringOut } as CSSProperties}
                className={`${caret} grid place-items-center`}
              >
                <span className="h-1/2 w-0.5 rounded-pill bg-foreground" style={{ opacity: bar }} />
              </span>
            </div>
          </Field>
        </div>
    </ContentBox>
  )
}

/** Anchors in component px: the six slots and the label are fixed; the ring slides from slot to slot on the macro's own spring. */
export function anchors(t: number, preset: PresetId = PRESET, options?: ContentOptions): Anchors {
  const { label, row, ring, slot1, slot2, slot3, slot4, slot5, slot6 } = layoutOf("otp-input", preset).rects
  const pitch = slot2.x - slot1.x
  return { label, row, slot1, slot2, slot3, slot4, slot5, slot6, ring: { x: ring.x + ringAt(t, Number(options?.every ?? EVERY)) * pitch, y: ring.y, w: ring.w, h: ring.h } }
}

/** Macro seconds of the beats at the default pace (option `every`: seconds between digits, default 0.1; success follows the last digit by 0.25): `type` is when digit i (0 to 5) lands, `success` when the first slot border turns (the sixth, 0.4 later). */
export const EVENTS = { type: CODE.split("").map((_, i) => TYPE_AT(i)), success: successAt() }

const content: MacroContent = { size, Content, anchors, events: EVENTS }

function OtpInputMacro({ t, preset = PRESET, scheme = SCHEME }: MacroProps) {
  return <MacroFrame content={content} preset={preset} scheme={scheme} t={t} zoom={K} cam={drift(t)} caption="OtpInput" />
}

export const macro: MacroDef = { slug: "otp-input", name: "OtpInput", preset: PRESET, scheme: SCHEME, Component: OtpInputMacro, content }
