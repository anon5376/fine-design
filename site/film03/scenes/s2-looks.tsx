"use client"

import { useRef } from "react"
import type { SceneProps } from "@/site/film/scene"
import { ease, lerp, progress, spring, type SpringSpec } from "@/site/film/clock"
import { PresetScene, PresetScope } from "../preset-scope"
import type { PresetId } from "../presets"
import { Composition, useTargets, type Rise } from "../s2/composition"
import { controlsAt, labelAt, pointerAt } from "../s2/motion"

// s2 2.5-8, "Three looks", on paper. One composition of real components in Ledger rises on the expressive spring; at 3.5 and 4.5 the
// preset flips (Folio, Poster) as the docs theme switch does, a crossfade between stacked scopes; at 5.5 a diagonal wipe (the same edge
// as s4's) sweeps left to right over 0.42s and uncovers the split, Ledger | Folio | Poster, each column holding the same composition;
// 6.5-8.0 the switch toggles off and on and the primary button presses in all three at once. Scene time t: rise 0, Folio 1.0, Poster 2.0,
// split 3.0, interaction 4.0-5.5.
// The split is one move: both frames stand still and only the edge travels, so every frame is the hero on one side of the edge and finished
// columns on the other (Poster is the hero's last look, so the right column is uncovered on its own paper). Each column's composition
// then settles up 36px on the expressive spring as the edge passes; nothing scales, nothing is half built.

const RISE: SpringSpec = { visualDuration: 0.5, bounce: 0.28 }
const SETTLE: SpringSpec = { visualDuration: 0.42, bounce: 0.14 }
const FADE = 0.24 // the moderate crossfade (160ms) at 1.5x: whole pages cross, so it needs a beat, but longer shows double type
const HERO_SCALE = 2.65 // the wide composition is 620px: 1643px on the frame, 86% of its width
const COL_SCALE = 2 // the stacked composition is 292px: 584px in a 640px column; Ledger's 14px labels land at 28px
const COL_DROP = 22 // the compositions sit a little low, under the theme names
const WIPE = 0.42
const LEAN = 240 // the wipe's edge leans like s4's
const COL_W = 640
const SPLIT = 3.0
const LABEL = 40 // theme names: 40px mono on the frame

const hero = (t: number) => {
  // A dolly in: a fast settle from slightly far away, then a slow push that carries through the flips and a small punch on each flip.
  const settle = lerp(0.9, 1, ease.outExpo(progress(t, 0, 1.3)))
  const push = 1 + 0.045 * progress(t, 0, SPLIT)
  const punch = [1.0, 2.0].reduce((m, f) => m + Math.sin(Math.PI * progress(t, f, 0.5)) * 0.018, 0)
  // 2D only (no perspective): text stays crisp at scale, where a 3D tilt would be resampled.
  return { s: HERO_SCALE * settle * (push + punch), x: lerp(-40, 30, ease.inOutSoft(progress(t, 0, 3))), y: lerp(24, -6, ease.inOutSoft(progress(t, 0, 3))), rz: lerp(-0.6, 0.25, ease.inOutSoft(progress(t, 0, 3))) }
}

const riseOf = (t: number): Rise => [0, 1, 2].map(i => spring(t - i * 0.07, RISE)) as Rise

function Hero({ t }: { t: number }) {
  const h = hero(t)
  const c = controlsAt(0)
  return (
    <div style={{ transform: `translate(${h.x}px, ${h.y}px) rotate(${h.rz}deg) scale(${h.s})` }} className="absolute inset-0 grid place-items-center">
      <Composition layout="wide" c={c} r={riseOf(t)} travel={110} />
    </div>
  )
}

function Label({ t }: { t: number }) {
  const l = labelAt(t)
  const show = 1 - progress(t, SPLIT - 0.04, 0.1) // gone before the wipe's edge brings the columns' own names
  return (
    <PresetScope preset={l.preset} scheme="light" className="absolute font-mono text-muted-foreground" style={{ left: 96, top: 52, fontSize: LABEL, opacity: show }}>
      <span className="whitespace-pre">{l.text}</span>
      <span className="ml-0.5 inline-block bg-current align-[-0.1em]" style={{ width: 4, height: "1em", opacity: l.caret ? 1 : 0 }} />
    </PresetScope>
  )
}

/** One look in the split: its composition at column scale, the pointer, and the switch and button driven by the clock. */
function Column({ t, delay }: { t: number; delay: number }) {
  const root = useRef<HTMLDivElement>(null)
  const sw = useRef<HTMLDivElement>(null)
  const btn = useRef<HTMLDivElement>(null)
  const tg = useTargets(root, sw, btn)
  const c = controlsAt(t)
  const p = tg ? pointerAt(t, tg.sw, tg.btn, tg.w, tg.h) : null
  return (
    <div className="absolute inset-0 grid place-items-center" style={{ transform: `translateY(${COL_DROP + (1 - spring(t - SPLIT - delay, SETTLE)) * 36}px)` }}>
      <div style={{ transform: `scale(${COL_SCALE})` }}>
        <div className="relative">
          <Composition layout="stack" c={c} rootRef={root} swRef={sw} btnRef={btn} />
          {p && (
            <div className="pointer-events-none absolute left-0 top-0" style={{ transform: `translate(${p.x}px, ${p.y}px)`, opacity: p.show }}>
              {p.ring.map((r, i) => (
                <div key={i} className="absolute rounded-full border-2 border-foreground" style={{ width: 28, height: 28, left: -14, top: -14, opacity: r > 0 && r < 1 ? 0.45 * (1 - r) : 0, transform: `scale(${0.5 + 1.5 * ease.out(r)})` }} />
              ))}
              {/* arrow cursor: the tip is the hot spot, so the body trails off the thing being clicked */}
              <svg width={24} height={24} viewBox="0 0 24 24" className="absolute overflow-visible" style={{ left: 0, top: 0, transformOrigin: "5px 3px", transform: `translate(-5px, -3px) scale(${p.pressed ? 0.86 : 1})` }}>
                <path d="M5 3 L5 19 L9.2 15.2 L12 21 L14.5 19.9 L11.8 14.3 L17.5 14.3 Z" fill="var(--foreground)" stroke="var(--background)" strokeWidth={1.5} strokeLinejoin="round" />
              </svg>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/** A column's look, full height: paper, the composition, the mono name top-left and a hairline on the right edge between columns. */
function Panel({ preset, i, t }: { preset: PresetId; i: number; t: number }) {
  return (
    <PresetScope preset={preset} scheme="light" bg className="absolute top-0" style={{ left: i * COL_W, width: COL_W, height: 1080 }}>
      <Column t={t} delay={0.12 + i * 0.1} />
      <div className="absolute font-mono text-muted-foreground" style={{ left: 40, top: 30, fontSize: LABEL }}>
        {`theme-${preset}`}
      </div>
      {i < 2 && <div className="absolute inset-y-0 right-0" style={{ width: 1, background: "color-mix(in oklch, var(--foreground) 16%, transparent)" }} />}
    </PresetScope>
  )
}

const LOOKS = ["ledger", "folio", "poster"] as const

export function S2Looks({ t }: SceneProps) {
  const folio = ease.inOut(progress(t, 1.0, FADE))
  const poster = ease.inOut(progress(t, 2.0, FADE))
  // 6.5-8.0: the whole split drifts in, so no frame is still.
  const drift = 1 + 0.015 * ease.inOutSoft(progress(t, 3.6, 1.9))
  const wipe = ease.inOut(progress(t, SPLIT, WIPE))
  const edge = wipe * (1920 + LEAN)
  const clip = wipe < 1 ? `polygon(0 0, ${edge}px 0, ${edge - LEAN}px 100%, 0 100%)` : undefined
  return (
    <PresetScene preset="ledger" scheme="light">
      <div className="absolute inset-0" style={{ transform: `scale(${drift})` }}>
        {t < SPLIT + WIPE && (
          <>
            <PresetScope preset="ledger" scheme="light" bg className="absolute inset-0">
              <Hero t={t} />
            </PresetScope>
            <PresetScope preset="folio" scheme="light" bg className="absolute inset-0" style={{ opacity: folio, visibility: folio > 0 ? "visible" : "hidden" }}>
              <Hero t={t} />
            </PresetScope>
            <PresetScope preset="poster" scheme="light" bg className="absolute inset-0" style={{ opacity: poster, visibility: poster > 0 ? "visible" : "hidden" }}>
              <Hero t={t} />
            </PresetScope>
          </>
        )}
        {t >= SPLIT && (
          <div className="absolute inset-0" style={{ clipPath: clip }}>
            {LOOKS.map((preset, i) => (
              <Panel key={preset} preset={preset} i={i} t={t} />
            ))}
          </div>
        )}
        <Label t={t} />
      </div>
    </PresetScene>
  )
}
