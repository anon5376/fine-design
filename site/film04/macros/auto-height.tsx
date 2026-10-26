"use client"

import { useLayoutEffect, useRef, useState, type CSSProperties } from "react"
import { AutoHeight } from "@/components/ui/auto-height"
import { Card } from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { ease, lerp, progress, spring } from "@/site/film/clock"
import { layoutOf } from "./layout"
import { ContentBox, MacroFrame, Pointer, SPRING, TIER, drift, unitOf, type Anchors, type ContentProps, type MacroContent, type MacroDef, type MacroProps, type PresetId, type Scheme } from "./kit"

// s2 macro 10, 15.5-17.0, Ledger dark: the docs' Expand example in a Card. A Switch and, under it, the real AutoHeight holding two fields.
// 0.00-0.25  the pointer eases in to the switch's lower right corner; the thumb stretches 16 to 18px as it is hovered.
// 0.15-0.29  the dot goes down (the thumb stretches to 20px) and the click lands at 0.25 (CLICK).
// 0.25-0.57  the thumb slides on the moderate spring (0.32 s) as the track turns primary (fast), and the AutoHeight box glides open on the
//            same spring, uncovering Street and City. Like the real component, the content is laid out whole and the box clips it, so the
//            fields are revealed top first, not faded. The camera follows the bottom edge down about half way, so the card is whole in frame.
// 0.55-1.0   the pointer slips off to the right; the open card holds to the cut.
// Real Card, Switch, Field, Input and AutoHeight. The Switch is rendered unchecked and the box is pinned to the clock with scoped CSS: the CSS
// transitions of both run on the browser's clock, which the renderer cannot pin. The Pane's mount fade is Motion's and is not pinned either: the
// real component mounts it at opacity 1 (AnimatePresence initial={false}), so it is held there. will-change on the box gives it a layer of its own:
// without it Chrome kept painting the box's first clip (height 0) after the pinned height grew, and the fields never showed in a render.
const PRESET: PresetId = "ledger"
const SCHEME: Scheme = "dark"
const K = 4
const CLICK = 0.25
const ARRIVE = 0.12
const LEAVE = 0.6

const PIN = `
.ah-pin div.overflow-hidden { height: var(--h) !important; transition: none !important; will-change: transform; }
.ah-pin div.overflow-hidden > div > div { opacity: 1 !important; }
.ah-pin [role="switch"] { transition: none !important; background-color: var(--track) !important; }
.ah-pin [role="switch"] > span { transition: none !important; --thumb: var(--tw) !important; translate: var(--tx) 0 !important; }
`

// The open card, top-aligned: the card is the subject and grows downward inside the box.
// At extreme close-ups the 34px dot would be a speck against a coin-sized control, so the pointer grows with the zoom, up to 3x from zoom 6 to 18.
const pointerK = (zoom: number) => zoom / Math.min(3, Math.max(1, zoom / 6))

export const size = { w: 288, h: 264 }

export function Content({ t, zoom }: ContentProps) {
  const wrap = useRef<HTMLDivElement>(null)
  const unit = useRef<HTMLDivElement>(null)
  const fields = useRef<HTMLDivElement>(null)
  const [m, setM] = useState<{ sw: { x: number; y: number }; fields: number; closed: number } | null>(null)
  useLayoutEffect(() => {
    const u = unitOf(unit.current!)
    const sw = wrap.current!.querySelector<HTMLElement>('[role="switch"]')!
    setM({
      sw: { x: (sw.offsetLeft + sw.offsetWidth / 2) / u, y: (sw.offsetTop + sw.offsetHeight / 2) / u },
      fields: fields.current!.offsetHeight / u,
      closed: wrap.current!.offsetHeight / u,
    })
  }, [])

  const press = t - CLICK
  const down = t - (CLICK - 0.1)
  const glide = spring(press, SPRING.moderate)
  const pressed = down < 0 ? 0 : down < 0.14 ? ease.enter(progress(down, 0, 0.08)) : 1 - ease.enter(progress(down, 0.14, TIER.moderate.enter))
  const hover = ease.enter(progress(t, ARRIVE, TIER.moderate.enter)) * (1 - ease.enter(progress(t, LEAVE, TIER.moderate.enter)))
  // Thumb width follows hover (18px) and press (20px); the checked thumb's right edge sits at 30px whatever its width.
  const w = 16 + 2 * hover + 2 * pressed
  const track = ease.inOutSoft(progress(press, 0, TIER.fast.enter))
  const vars = {
    "--h": `${(m?.fields ?? 0) * glide}px`,
    "--tw": `${w}px`,
    "--tx": `${(30 - w) * glide}px`,
    "--track": `color-mix(in oklch, var(--primary) ${track * 100}%, var(--input))`,
  } as CSSProperties

  const reach = ease.out(progress(t, 0, 0.25))
  const away = ease.in(progress(t, LEAVE, 0.4))
  const tx = (m?.sw.x ?? 0) + 11
  const ty = (m?.sw.y ?? 0) + 10
  const px = lerp(tx + 120, tx, reach) + 140 * away
  const py = lerp(ty + 70, ty, reach) + 40 * away

  return (
    <ContentBox w={size.w} h={size.h}>
      <style>{PIN}</style>
        <div ref={wrap} className="ah-pin relative" style={vars}>
          <div ref={unit} className="invisible absolute" style={{ width: 100, height: 0 }} />
          <Card className="gap-0">
            <label className="flex items-center justify-between gap-4 text-sm font-label">
              Separate billing address
              <Switch checked={false} aria-label="Separate billing address" />
            </label>
            <AutoHeight>
              <div ref={fields} className="grid gap-3 pt-4">
                <Field>
                  <FieldLabel>Street</FieldLabel>
                  <Input autoComplete="off" readOnly tabIndex={-1} defaultValue="18 Harbour Row" />
                </Field>
                <Field>
                  <FieldLabel>City</FieldLabel>
                  <Input autoComplete="off" readOnly tabIndex={-1} defaultValue="Rotterdam" />
                </Field>
              </div>
            </AutoHeight>
          </Card>
          {m && <Pointer x={px} y={py} k={pointerK(zoom)} press={down} opacity={1 - progress(t, LEAVE + 0.2, 0.2)} />}
        </div>
    </ContentBox>
  )
}

/**
 * Anchors in component px. `card` and `bottom` (the card's lower edge, the point to ride down) grow with the glide; the switch and the two fields are
 * fixed (the box clips the fields, it does not move them), so `street` and `city` sit in their place from the first frame, hidden until the edge passes.
 */
export function anchors(t: number, preset: PresetId = PRESET): Anchors {
  const { rects: r } = layoutOf("auto-height", preset)
  const glide = spring(t - CLICK, SPRING.moderate)
  const top = r.card.y - r.card.h / 2
  const h = r.card.h + (r.cardOpen.h - r.card.h) * glide
  return {
    card: { x: r.card.x, y: top + h / 2, w: r.card.w, h },
    bottom: { x: r.card.x, y: top + h, w: r.card.w },
    switch: r.sw, label: r.swlabel, fields: r.fields, street: r.street, city: r.city, streetLabel: r.streetLabel, cityLabel: r.cityLabel,
  }
}

/** Macro seconds of the beats: the switch click, from which the box glides open. */
export const EVENTS = { click: CLICK }

const content: MacroContent = { size, Content, anchors, events: EVENTS }

function AutoHeightMacro({ t, preset = PRESET, scheme = SCHEME }: MacroProps) {
  // v1: the box was as tall as the open card, centred. The closed card is framed lower (top at 380px) and the camera rises as it opens.
  const open = layoutOf("auto-height", PRESET).rects.cardOpen.h
  const glide = spring(t - CLICK, SPRING.moderate)
  const cam = drift(t, { s: 0.95, y: 0 }, { s: 1.03, y: 0 })
  cam.y = (cam.y ?? 0) + (380 - (540 - (open * K) / 2)) * (1 - glide)
  return <MacroFrame content={content} preset={preset} scheme={scheme} t={t} zoom={K} cam={cam} focus={{ x: size.w / 2, y: open / 2 }} caption="AutoHeight" />
}

export const macro: MacroDef = { slug: "auto-height", name: "AutoHeight", preset: PRESET, scheme: SCHEME, Component: AutoHeightMacro, content }
