"use client"

import { useLayoutEffect, useRef, useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { IconButton } from "@/components/ui/icon-button"
import { Input } from "@/components/ui/input"
import { ease, lerp, progress, spring } from "@/site/film/clock"
import { caretOn } from "@/site/film03/s456/shared"
import { layoutOf } from "./layout"
import { ContentBox, MacroFrame, Pointer, SPRING, TIER, drift, unitOf, type Anchors, type ContentProps, type MacroContent, type MacroDef, type MacroProps, type PresetId, type Scheme } from "./kit"

// s2 macro 6, 9.5-11.0, Poster dark: Label, PasswordInput with its strength meter, FieldDescription.
// 0.05-0.86  the passphrase "correct-horse-battery" is typed (12 characters one every 0.06 s, the other 9 as the typist gets going). Strength follows the
//            character count: 3 Weak (danger), 6 Fair (warning), 9 Good (info), 12 Strong (success). The segment a level adds fills on the moderate
//            spring, 0.08 s per place after the level change; the ones already filled fade to the new level's color (moderate, same stagger).
// 0.55-0.9   the pointer comes in from the right and rests on the eye (hover tint, stroke 2). 0.93 press.
// 1.00       the click: focus leaves the field (ring off, fast), the eye swaps for its slashed twin (old out on the fast exit, new in on the fast
//            spring from scale 0.5) and the field shows the text.
// The real Field, Input and IconButton with their own classes; the meter is the component's markup with its moving parts (fill scale, fill
// color, eye swap) set from the film clock, because its CSS transitions and Motion springs cannot be pinned. Times are the tiers at 2x.
const PRESET: PresetId = "poster"
const SCHEME: Scheme = "dark"
const K = 4.1
const W = 280
const H = 140

const TEXT = "correct-horse-battery"
const labels = ["", "Weak", "Fair", "Good", "Strong"]
// Level 0 and 1 share danger, as in the component (a segment that fills from empty takes its color at once).
const tones = ["--danger", "--danger", "--warning", "--info", "--success"]

const charAt = (i: number) => (i < 12 ? 0.05 + 0.06 * i : 0.71 + ((i - 11) * 0.15) / 9)
// The renders in which the level changes: the 3rd, 6th, 9th and 12th character.
const LEVEL_AT = [charAt(2), charAt(5), charAt(8), charAt(11)]
const CLICK = 1.0
const PRESS = 0.93

/** Weights over `tones` for segment i at t: born in the color of the level it fills at, then fading to each later level's color after its own stagger, from wherever the last fade had got to. */
function segmentColor(i: number, t: number): number[] {
  const one = (n: number): number[] => tones.map((_, k) => (k === n ? 1 : 0))
  let from = one(i + 1)
  let to = from
  let start = 0
  const at = (s: number) => from.map((v, k) => lerp(v, to[k], spring(s - start, SPRING.moderate)))
  for (let level = i + 2; level <= 4; level++) {
    const s = LEVEL_AT[level - 1] + i * TIER.stagger
    if (t < s) break
    from = at(s)
    to = one(level)
    start = s
  }
  return at(t)
}

function mix(w: number[]): string {
  let acc = ""
  let sum = 0
  w.forEach((v, n) => {
    if (v < 0.0005) return
    sum += v
    acc = acc ? `color-mix(in oklab, ${acc} ${(100 * (1 - v / sum)).toFixed(2)}%, var(${tones[n]}) ${(100 * (v / sum)).toFixed(2)}%)` : `var(${tones[n]})`
  })
  return acc
}

export const size = { w: W, h: H }

export function Content({ t, preset = PRESET, zoom, options }: ContentProps) {
  // Option `late`: seconds the pointer and the click come after their v1 times (typing and the strength steps stay), so a shot can type fast and click later.
  const late = Number(options?.late ?? 0)
  const tp = t - late
  // Option `glide`: the pointer travels on an in-out ease instead of landing early, so it is seen coming.
  const travel = options?.glide ? ease.inOut : ease.out
  const unit = useRef<HTMLDivElement>(null)
  const wrap = useRef<HTMLDivElement>(null)
  const eye = useRef<HTMLButtonElement>(null)
  const [eyeAt, setEyeAt] = useState<{ x: number; y: number } | null>(null)
  useLayoutEffect(() => {
    const u = unitOf(unit.current!)
    const b = eye.current!
    const w = wrap.current!
    setEyeAt({ x: (w.offsetLeft + b.offsetLeft + b.offsetWidth / 2) / u, y: (w.offsetTop + b.offsetTop + b.offsetHeight / 2) / u })
  }, [preset])

  const typed = TEXT.split("").filter((_, i) => charAt(i) <= t).length
  const level = typed >= 12 ? 4 : typed >= 9 ? 3 : typed >= 6 ? 2 : typed >= 3 ? 1 : 0
  const shown = tp >= CLICK

  // Focus leaves the field with the click: the border goes back to the input color on the fast tier.
  const blur = ease.enter(progress(tp, CLICK, TIER.fast.enter))
  const border = `color-mix(in oklab, var(--ring) ${(100 * (1 - blur)).toFixed(1)}%, var(--input) ${(100 * blur).toFixed(1)}%)`

  // The eye pair: the leaving glyph exits on the fast exit tween, the arriving one springs in from scale 0.5.
  const out = ease.exit(progress(tp, CLICK, TIER.fast.exit))
  const inn = spring(tp - CLICK, SPRING.fast)
  const hover = progress(tp, 0.78, 0.1)
  const press = tp - PRESS
  const dipped = press >= 0 ? (press < 0.14 ? ease.out(progress(press, 0, 0.07)) : 1 - ease.out(progress(press, 0.14, 0.12))) : 0
  const tint = `color-mix(in oklab, color-mix(in oklab, transparent ${(100 * (1 - hover)).toFixed(1)}%, var(--hover) ${(100 * hover).toFixed(1)}%) ${(100 * (1 - dipped)).toFixed(1)}%, var(--active) ${(100 * dipped).toFixed(1)}%)`

  // A focused field has a caret: it follows the last bullet, holds while typing and blinks at 2 Hz after, and leaves with the focus at the click.
  const { caret: bar, rects: rect } = layoutOf("password-input", preset)
  const lastTyped = typed > 0 ? charAt(typed - 1) : -1
  const caretShown = tp < CLICK && caretOn(t, t - lastTyped < 0.15 && typed < TEXT.length) && !!eyeAt
  const caretX = bar!.x0 + typed * bar!.adv

  const target = eyeAt ?? { x: W - 20, y: 40 }
  const arrive = travel(progress(tp, 0.55, 0.38))
  const leave = ease.out(progress(tp, PRESS + 0.34, 0.3))
  const px = lerp(W + 36, target.x, arrive) + 8 * leave
  const py = lerp(target.y + 84, target.y, arrive) + 12 * leave

  return (
    <ContentBox w={size.w} h={size.h}>
        <div ref={unit} className="invisible absolute" style={{ width: 100, height: 0 }} />
        <div className="flex h-full flex-col justify-center" style={{ opacity: eyeAt ? 1 : 0 }}>
          <Field className="w-full">
            <FieldLabel>Password</FieldLabel>
            <div className="grid w-full gap-2">
              <div ref={wrap} className="relative">
                <Input
                  readOnly
                  tabIndex={-1}
                  type={shown ? "text" : "password"}
                  value={TEXT.slice(0, typed)}
                  className="pr-[calc(var(--control-sm)+0.25rem)]"
                  style={{ transition: "none", borderColor: border, outline: blur < 1 ? "var(--focus-ring-width) solid var(--ring)" : "none", outlineOffset: 0 }}
                />
                <IconButton
                  ref={eye}
                  label={shown ? "Hide password" : "Show password"}
                  tabIndex={-1}
                  className="absolute inset-y-1 right-1 h-auto w-auto aspect-square [&>span:first-child]:[--btn-bg:var(--film-tint)] [&>span:first-child]:transition-none"
                  style={{ "--film-tint": tint } as React.CSSProperties}
                >
                  <span className="inline-grid">
                    <span className="col-start-1 row-start-1 flex" style={{ opacity: 1 - out, transform: `scale(${lerp(1, 0.5, out)})` }}>
                      <Eye style={{ transition: "none", strokeWidth: hover * 0.5 + 1.5 }} />
                    </span>
                    <span className="col-start-1 row-start-1 flex" style={{ opacity: inn, transform: `scale(${lerp(0.5, 1, inn)})` }}>
                      <EyeOff style={{ transition: "none", strokeWidth: hover * 0.5 + 1.5 }} />
                    </span>
                  </span>
                </IconButton>
              </div>
              <div className="grid gap-1.5">
                <div aria-hidden data-strength-meter="" className="grid grid-cols-4 gap-1">
                  {[0, 1, 2, 3].map(i => {
                    const born = LEVEL_AT[i] + i * TIER.stagger
                    return (
                      <span key={i} className="h-1 overflow-hidden rounded-pill bg-secondary">
                        <span
                          data-fill=""
                          className="block h-full origin-left rounded-[inherit]"
                          style={{ transform: `scaleX(${spring(t - born, SPRING.moderate)})`, backgroundColor: t >= LEVEL_AT[i] ? mix(segmentColor(i, t)) : "transparent" }}
                        />
                      </span>
                    )
                  })}
                </div>
                <p className="min-h-lh text-xs text-muted-foreground">{labels[level]}</p>
              </div>
            </div>
            <FieldDescription>At least 12 characters.</FieldDescription>
          </Field>
        </div>
        <span
          aria-hidden
          data-caret=""
          className="pointer-events-none absolute bg-foreground"
          style={{ left: caretX - 0.75, top: rect.field.y - rect.field.h * 0.27, width: 1.5, height: rect.field.h * 0.54, opacity: caretShown ? 1 : 0 }}
        />
        {eyeAt && <Pointer x={px} y={py} k={zoom} press={press} opacity={progress(tp, 0.55, 0.12) * (1 - 0.6 * leave)} />}
    </ContentBox>
  )
}

/**
 * Anchors in component px. The field, label, eye and meter are fixed; `caret` is after the last typed bullet (it stops at the eye's click), `strength`
 * is the label under the meter at the width of the word now on show, `bullets` and `text` the typed run (bullets before the click, the passphrase after).
 */
export function anchors(t: number, preset: PresetId = PRESET): Anchors {
  const { rects: r, caret: bar, words } = layoutOf("password-input", preset)
  const typed = TEXT.split("").filter((_, i) => charAt(i) <= t).length
  const level = typed >= 12 ? 4 : typed >= 9 ? 3 : typed >= 6 ? 2 : typed >= 3 ? 1 : 0
  const word = words![labels[Math.max(1, level)]]
  const caretX = bar!.x0 + typed * bar!.adv
  const run = typed * bar!.adv
  return {
    field: r.field, label: r.label, eye: r.eye, meter: r.meter, bar1: r.bar1, bar2: r.bar2, bar3: r.bar3, bar4: r.bar4, hint: r.hint,
    strength: { x: r.strength.x - r.strength.w / 2 + word / 2, y: r.strength.y, w: word, h: r.strength.h },
    caret: { x: caretX, y: r.field.y, w: 1.5, h: r.field.h * 0.54 },
    bullets: { x: bar!.x0 + run / 2, y: r.field.y, w: run, h: r.field.h * 0.54 },
  }
}

/** Macro seconds of the beats: `type` is when character i (0 to 20) lands, `levels` when Weak, Fair, Good and Strong show, `click` the eye's. */
export const EVENTS = { type: TEXT.split("").map((_, i) => charAt(i)), levels: LEVEL_AT, press: PRESS, click: CLICK }

const content: MacroContent = { size, Content, anchors, events: EVENTS }

function PasswordInputMacro({ t, preset = PRESET, scheme = SCHEME }: MacroProps) {
  return <MacroFrame content={content} preset={preset} scheme={scheme} t={t} zoom={K} cam={drift(t, {}, { s: 1.06, x: -34 })} caption="PasswordInput" />
}

export const macro: MacroDef = { slug: "password-input", name: "PasswordInput", preset: PRESET, scheme: SCHEME, Component: PasswordInputMacro, content }
