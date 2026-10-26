"use client"

import type { SceneProps } from "@/site/film/scene"
import { ease, lerp, progress, spring } from "@/site/film/clock"
import { fontStack } from "@/site/film/wordmark"
import { PresetScene } from "@/site/film03/preset-scope"
import type { PresetId } from "@/site/film03/presets"
import { InTile } from "../frame"
import { MACROS, MACRO_LENGTH, type MacroDef } from "../macros"
import { SPRING } from "../macros/kit"
import { MacroTile } from "../tile"

// s3 17.0-21.5, ink: the ten macros as live tiles, 5 across and 2 down. Scene time t (0 at 17.0):
// 0.00-0.80  tiles land in reading order, 0.06 s apart (tile 0 from -0.1), on the expressive spring; each starts its macro as it lands (slowed to 0.75x so the
//            first look fills the time to the switch). The empty slots are drawn from frame 0 so the stage is never bare.
// 2.25-2.80  at 19.25 every tile crosses to the next preset (Ledger to Folio, Folio to Poster, Poster to Ledger; the scheme stays), staggered the
//            same 0.06 s, and plays its macro again from the start. The last replay ends at 21.29.
// The whole wall pulls back 4% over the scene. Cut in from macro 10 (Ledger dark) and out to s4 are ink to ink.
const COLS = 5
const TILE = { w: 342, h: 300 }
const GAP = 20
const CAPTION = { size: 28, gap: 14, line: 34 }
const ROW = TILE.h + CAPTION.gap + CAPTION.line
const ROW_GAP = 40
const X0 = (1920 - (COLS * TILE.w + (COLS - 1) * GAP)) / 2
const Y0 = 176
const STAGGER = 0.06
const LEAD = 0.1 // tile 0 is already landing at the cut, so the first frame is never bare
const SWITCH = 2.25
const FADE = 0.22
const FIRST_RATE = 0.75
// Each tile is framed on its own subject: scale and the frame x of the subject's centre, from the widest extent of its elements over the macro (the
// subjects run 1200 to 1630px wide on the frame, so one scale would clip some and shrink the rest), with 40px of paper each side.
const FIT: Record<string, { scale: number; cx: number }> = {
  "copy-button": { scale: 0.246, cx: 860 },
  "async-status": { scale: 0.259, cx: 936 },
  "confirm-button": { scale: 0.206, cx: 937 },
  "reaction-button": { scale: 0.254, cx: 952 },
  "notification-bell": { scale: 0.264, cx: 944 },
  "password-input": { scale: 0.263, cx: 918 },
  "otp-input": { scale: 0.204, cx: 946 },
  checklist: { scale: 0.2, cx: 946 },
  stepper: { scale: 0.238, cx: 950 },
  "auto-height": { scale: 0.257, cx: 960 },
}
const NEXT: Record<PresetId, PresetId> = { ledger: "folio", folio: "poster", poster: "ledger" }

function Tile({ def, i, t }: { def: MacroDef; i: number; t: number }) {
  const lt = t - i * STAGGER + LEAD
  if (lt <= 0) return null
  const rise = spring(lt, SPRING.expressive)
  const sw = SWITCH + i * STAGGER
  const mix = ease.inOut(progress(t - sw, 0, FADE))
  const x = X0 + (i % COLS) * (TILE.w + GAP)
  const y = Y0 + Math.floor(i / COLS) * (ROW + ROW_GAP)
  const { Component } = def
  return (
    <div
      className="absolute"
      style={{ left: x, top: y, width: TILE.w, opacity: progress(lt, 0, 0.1), transform: `translateY(${lerp(72, 0, rise)}px) scale(${lerp(0.9, 1, rise)})`, transformOrigin: "50% 50%" }}
    >
      <div className="relative rounded-container overflow-hidden" style={{ width: TILE.w, height: TILE.h }}>
        <InTile.Provider value>
          {mix < 1 && (
            <MacroTile {...TILE} {...FIT[def.slug]} preset={def.preset} scheme={def.scheme}>
              <Component t={Math.min(MACRO_LENGTH, lt * FIRST_RATE)} />
            </MacroTile>
          )}
          {t >= sw && (
            <div className="absolute inset-0" style={{ opacity: mix }}>
              <MacroTile {...TILE} {...FIT[def.slug]} preset={NEXT[def.preset]} scheme={def.scheme}>
                <Component t={Math.min(MACRO_LENGTH, t - sw)} preset={NEXT[def.preset]} />
              </MacroTile>
            </div>
          )}
        </InTile.Provider>
        <div className="pointer-events-none absolute inset-0 rounded-container border-line border-border" />
      </div>
      <div className="whitespace-nowrap text-muted-foreground" style={{ marginTop: CAPTION.gap, fontFamily: fontStack("mono"), fontSize: CAPTION.size, lineHeight: `${CAPTION.line}px`, letterSpacing: "-0.01em" }}>
        {def.name}
      </div>
    </div>
  )
}

export function S3Wall({ t, duration }: SceneProps) {
  const back = lerp(1.04, 1, ease.out(progress(t, 0, duration)))
  return (
    <PresetScene preset="ledger" scheme="dark">
      <div className="absolute inset-0" style={{ transform: `scale(${back})`, transformOrigin: "50% 50%" }}>
        {MACROS.map((_, i) => (
          <div
            key={i}
            className="absolute rounded-container border-line border-border opacity-70"
            style={{ left: X0 + (i % COLS) * (TILE.w + GAP), top: Y0 + Math.floor(i / COLS) * (ROW + ROW_GAP), width: TILE.w, height: TILE.h }}
          />
        ))}
        {MACROS.map((def, i) => (
          <Tile key={def.slug} def={def} i={i} t={t} />
        ))}
      </div>
      <div className="absolute text-muted-foreground" style={{ left: X0, top: 56, fontFamily: fontStack("mono"), fontSize: 40, letterSpacing: "-0.01em" }}>
        10 new components
      </div>
    </PresetScene>
  )
}
