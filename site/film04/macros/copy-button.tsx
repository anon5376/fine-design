"use client"

import { useLayoutEffect, useRef, useState, type CSSProperties } from "react"
import { CopyButton } from "@/components/ui/copy-button"
import { ease, lerp, progress, spring } from "@/site/film/clock"
import { layoutOf } from "./layout"
import { ContentBox, MacroFrame, Pointer, SPRING, TIER, drift, unitOf, type Anchors, type ContentProps, type MacroContent, type MacroDef, type MacroProps, type PresetId, type Scheme } from "./kit"

// s2 macro 1, 2.0-3.5, Ledger light: an API key in the docs' Snippet frame with the real CopyButton in its corner.
// 0.00-0.30  the pointer eases in from the lower right to the button's corner; from about 0.2 the button is hovered (fill, icon stroke 1.5 to 2).
// 0.35       click (CLICK): the copy icon leaves on the fast exit (opacity and scale to 0.5, ease-exit, 0.12 s) as the check enters on the
//            fast tier (0.16 s, ease-enter, scale 0.5 to 1) and its stroke draws on the moderate spring (0.32 s). The press shrinks the fill 1px a side.
// 0.60-0.95  the pointer slips away down and right, so the check holds alone to the cut at 1.5. The camera pushes toward the icon.
// The component is the real CopyButton at rest. Its two icon layers, their stroke and the button's fill are driven from the clock with
// scoped CSS (data-on and the :hover, :active and transition rules cannot be pinned by the renderer, and the CSS clock is not the film's).
const PRESET: PresetId = "ledger"
const SCHEME: Scheme = "light"
const KEY = "key_4eC39HqLyjWDarjt"
const K = 4.8
const CLICK = 0.35
const ARRIVE = 0.2 // the pointer is over the button from here
const LEAVE = 0.62 // and starts to leave here

// The real component's classes address its parts by data-on and group state; these rules pin each part to a variable instead.
// span.grid is the icon stack; its children are the idle, copied and failed layers, in that order.
const PIN = `
.cb-pin button span.grid > span { transition: none !important; }
.cb-pin button span.grid > span:nth-child(1) { opacity: var(--o1) !important; scale: var(--s1) !important; }
.cb-pin button span.grid > span:nth-child(1) svg { stroke-width: var(--sw) !important; transition: none !important; }
.cb-pin button span.grid > span:nth-child(2) { opacity: var(--o2) !important; scale: var(--s2) !important; }
.cb-pin button span.grid > span:nth-child(2) path { stroke-dashoffset: var(--dash) !important; transition: none !important; }
.cb-pin button > span:first-child { transition: none !important; --btn-bg: var(--fill) !important; box-shadow: 0 0 0 calc(1px * (1 - var(--press))) var(--btn-bg) !important; }
`

// h is the snippet in the tallest preset; v1 centred a 44px box with the snippet at its top, which `focus` below keeps.
export const size = { w: 240, h: 52 }

/** Options: `key` is the key text's opacity, 0 to 1 (the montage's check shows the button alone at 0; a close-up fades it in as the camera pulls back); `ptr` scales the pointer's dot (a close-up wants a bigger one; default 1). Layout is untouched. */
export function Content({ t, zoom, options }: ContentProps) {
  const ptr = Number(options?.ptr ?? 1)
  const keyOpacity = Number(options?.key ?? 1)
  const wrap = useRef<HTMLDivElement>(null)
  const unit = useRef<HTMLDivElement>(null)
  const [at, setAt] = useState<{ x: number; y: number } | null>(null)
  useLayoutEffect(() => {
    const u = unitOf(unit.current!)
    const b = wrap.current!.querySelector("button")!
    // The button's centre in the wrapper's component pixels (the wrapper is the Snippet frame, at the box's origin).
    setAt({ x: (b.offsetLeft + b.offsetWidth / 2) / u, y: (b.offsetTop + b.offsetHeight / 2) / u })
  }, [])

  const press = t - CLICK
  const down = t - (CLICK - 0.1) // the pointer's dot goes down 0.1 s before the click lands (a click fires on release)
  const out = ease.exit(progress(press, 0, TIER.fast.exit))
  const inn = ease.enter(progress(press, 0, TIER.fast.enter))
  const draw = spring(press, SPRING.moderate)
  const hover = ease.enter(progress(t, ARRIVE, TIER.moderate.enter)) * (1 - ease.enter(progress(t, LEAVE, TIER.moderate.enter)))
  const stroke = ease.enter(progress(t, ARRIVE, TIER.fast.enter)) * (1 - ease.enter(progress(t, LEAVE, TIER.fast.enter)))
  // Pressed while the pointer's dot is down (0.14 s); the fill falls back to hover on the moderate tier.
  const pressed = down < 0 ? 0 : down < 0.14 ? ease.enter(progress(down, 0, 0.08)) : 1 - ease.enter(progress(down, 0.14, TIER.moderate.enter))
  const vars = {
    "--o1": 1 - out,
    "--s1": lerp(1, 0.5, out),
    "--o2": inn,
    "--s2": lerp(0.5, 1, inn),
    "--dash": 1 - draw,
    "--sw": lerp(1.5, 2, stroke),
    "--press": pressed,
    "--fill": `color-mix(in oklch, var(--active) ${pressed * 100}%, color-mix(in oklch, var(--hover) ${hover * 100}%, transparent))`,
  } as CSSProperties

  // From the lower right to a point on the button's lower-right quarter, clear of the 16px icon, then away again once the check is in.
  const reach = ease.out(progress(t, 0, 0.3))
  const away = ease.in(progress(t, LEAVE, 0.4))
  const tx = (at?.x ?? 0) + 10
  const ty = (at?.y ?? 0) + 9
  const px = lerp(tx + 150, tx, reach) + 90 * away
  const py = lerp(ty + 105, ty, reach) + 60 * away

  return (
    <ContentBox w={size.w} h={size.h}>
      <style>{PIN}</style>
        <div ref={wrap} className="cb-pin relative w-full rounded-container border-line border-border bg-muted py-3 pr-12 pl-4" style={vars}>
          <div ref={unit} className="invisible absolute" style={{ width: 100, height: 0 }} />
          <code className="figures font-mono text-sm" style={{ opacity: keyOpacity }}>{KEY}</code>
          <CopyButton className="absolute top-1.5 right-1.5" text={KEY} label="Copy API key" />
          {at && <Pointer x={px} y={py} k={zoom / ptr} press={down} opacity={1 - progress(t, LEAVE + 0.2, 0.2)} />}
        </div>
    </ContentBox>
  )
}

/** Anchors in component px. The button, its icon and the key are fixed; the check is drawn where the icon was. */
export function anchors(t: number, preset: PresetId = PRESET): Anchors {
  void t
  const { snippet, key, button, icon } = layoutOf("copy-button", preset).rects
  return { snippet, key, button, icon, check: icon }
}

/** Macro seconds of the beats. */
export const EVENTS = { arrive: ARRIVE, click: CLICK, leave: LEAVE }

const content: MacroContent = { size, Content, anchors, events: EVENTS }

function CopyButtonMacro({ t, preset = PRESET, scheme = SCHEME }: MacroProps) {
  // Aimed at the icon: the plane slides left as it scales, so the corner with the button comes toward the middle of the frame.
  const cam = drift(t, { s: 0.96, x: 0 }, { s: 1.1, x: -110 })
  return <MacroFrame content={content} preset={preset} scheme={scheme} t={t} zoom={K} cam={cam} focus={{ x: size.w / 2, y: 22 }} caption="CopyButton" />
}

export const macro: MacroDef = { slug: "copy-button", name: "CopyButton", preset: PRESET, scheme: SCHEME, Component: CopyButtonMacro, content }
