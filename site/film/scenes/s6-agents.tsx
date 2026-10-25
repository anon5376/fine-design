"use client"

import type { ReactNode } from "react"
import { Check } from "lucide-react"
import { Scene, type SceneProps } from "../scene"
import { clamp, ease, lerp, progress, spring, springs } from "../clock"
import { fontStack } from "../wordmark"
import { LLMS } from "../s456/llms-lines"
import { camStyle } from "../s456/cam"

// S6 For agents (16.0-19.5), ink. Left half: the plugin install types from the first frame (16.0) and answers with a check, the
// whole stack centred vertically. Right half: a dense column of llms.txt streams upward, already moving at the cut. At 17.6 three MCP tool names pop in as chips (staggered, hero spring); at 18.9 they collapse into one line,
// `npx shadcn add @fine/select`, which wipes out left to right, then the panel and the stream follow so S7 starts on clean ink.

const CMD = "/plugin install fine-design@fine-design"
const FINAL = "npx shadcn add @fine/select"
const TOOLS = ["search_items_in_registries", "view_items_in_registries", "get_add_command_for_items"]
const TYPE_AT = 0
const TYPE_CPS = 55
const OK_AT = 1.05
const CHIP_AT = 1.6
const CHIP_STAGGER = 0.1
const CALLS = [2.0, 2.22, 2.44] // each tool is "called": its chip inverts for a beat
const COLLAPSE_AT = 2.9
const COLLAPSE_DUR = 0.22
const OUT_CMD = 3.3
const OUT_PANEL = 3.3
const END = 3.5

const L1 = "/plugin install"
const L2 = "fine-design@fine-design"
const PANEL = { x: 96, w: 820 } // left half, no box: type straight on ink, at scale
const BIG = 60 // command size
const ROW = 78
const CHIP_H = 76
const CHIP_PITCH = 96
// The stack (command, check line, three chips) is centred on the frame's mid-line.
const GAP_OK = 18
const GAP_CHIPS = 40
const STACK_H = ROW * 2 + GAP_OK + 80 + GAP_CHIPS + CHIP_PITCH * 2 + CHIP_H
const CMD_Y = Math.round((1080 - STACK_H) / 2)
const OK_Y = CMD_Y + ROW * 2 + GAP_OK
const CHIP_Y0 = OK_Y + 80 + GAP_CHIPS
const MID = CHIP_Y0 + CHIP_PITCH // the row the chips collapse onto
const STREAM = { x: 1020, w: 860, size: 27, pitch: 44 } // the right half

const inset = (left: number) => `inset(0 0 0 ${(left * 100).toFixed(3)}%)`

export function S6Agents({ t }: SceneProps) {
  const mono = fontStack("mono")
  const typed = clamp(Math.floor((t - TYPE_AT) * TYPE_CPS) + 1, 0, CMD.length) // the first character is on screen at 16.0
  const typing = t >= TYPE_AT && typed < CMD.length
  // 2Hz caret: solid while typing, blinking before and after, gone once the check line is in.
  const caretOn = t < OK_AT && (typing || Math.floor(t * 4) % 2 === 0)

  const panelOut = ease.in(progress(t, OUT_PANEL, END - OUT_PANEL))
  const panelClip = panelOut > 0 ? inset(panelOut) : undefined

  const okRise = 1 - ease.outExpo(progress(t, OK_AT, 0.4))

  const collapse = ease.inOut(progress(t, COLLAPSE_AT, COLLAPSE_DUR))
  const finalIn = ease.outExpo(progress(t, COLLAPSE_AT + 0.08, 0.24))
  const cmdOut = ease.inOut(progress(t, OUT_CMD, 0.16))

  // llms.txt: a long column that is already moving at the cut, easing to a crawl. Two copies so it never runs dry.
  const sp = progress(t, 0, END)
  const scroll = 2200 * (0.5 * sp + 0.5 * (1 - (1 - sp) ** 2)) + 900 * ease.in(progress(t, OUT_PANEL, END - OUT_PANEL))
  const streamOut = ease.in(progress(t, OUT_PANEL, END - OUT_PANEL))
  const rows = LLMS.length
  const list = rows * STREAM.pitch
  const lines: ReactNode[] = []
  for (let c = 0; c < 2; c++) {
    LLMS.forEach(([name, rest], i) => {
      const y = c * list + i * STREAM.pitch - (scroll % list) + 12
      if (y < -STREAM.pitch || y > 1080) return
      const edge = Math.min(y + STREAM.pitch / 2, 1080 - y - STREAM.pitch / 2)
      // a reading band at mid-height: the line under it lights up as the column moves
      const band = Math.exp(-(((y + STREAM.pitch / 2 - 540) / 130) ** 2))
      lines.push(
        <div key={c * rows + i} className="absolute left-0 whitespace-pre" style={{ top: y, opacity: clamp(edge / 150, 0, 1) * (0.42 + 0.58 * band) }}>
          <span className="text-muted-foreground">- [</span>
          <span className="text-foreground">{name}</span>
          <span className="text-muted-foreground">{rest}</span>
        </div>,
      )
    })
  }

  return (
    <Scene theme="dark">
      <div style={camStyle({ s: lerp(1, 1.045, ease.out(progress(t, 0, END))), ry: lerp(3, 0, ease.out(progress(t, 0, END))), p: 2600 })}>
      <div className="absolute" style={{ left: PANEL.x, top: 0, width: PANEL.w, height: 1080, clipPath: panelClip }}>
        <div className="absolute inset-0" style={{ fontFamily: mono, letterSpacing: "-0.03em" }}>
          <div className="absolute left-0 whitespace-pre text-foreground" style={{ top: CMD_Y, height: ROW, lineHeight: `${ROW}px`, fontSize: BIG }}>
            {CMD.slice(0, Math.min(typed, L1.length))}
            {typed <= L1.length && <Caret on={caretOn} h={BIG * 0.95} />}
          </div>
          <div className="absolute left-0 whitespace-pre text-foreground" style={{ top: CMD_Y + ROW, height: ROW, lineHeight: `${ROW}px`, fontSize: BIG }}>
            {typed > L1.length + 1 ? L2.slice(0, typed - L1.length - 1) : ""}
            {typed > L1.length && <Caret on={caretOn} h={BIG * 0.95} />}
          </div>
          <div className="absolute left-0 overflow-clip whitespace-pre text-muted-foreground" style={{ top: OK_Y, height: 80, lineHeight: "80px", fontSize: 40, visibility: t >= OK_AT ? "visible" : "hidden" }}>
            <div className="flex items-center gap-5" style={{ transform: `translateY(${okRise * 100}%)` }}>
              <Check className="text-accent" style={{ width: 40, height: 40 }} strokeWidth={2.25} aria-hidden />
              <span>fine-design installed</span>
            </div>
          </div>

          {TOOLS.map((name, i) => {
            const s = t - (CHIP_AT + i * CHIP_STAGGER)
            if (s < 0) return null
            const pop = spring(s, springs.hero)
            const y0 = CHIP_Y0 + i * CHIP_PITCH
            const y = lerp(y0, MID, collapse)
            const call = ease.out(progress(t, CALLS[i], 0.06)) * (1 - ease.out(progress(t, CALLS[i] + 0.2, 0.12)))
            return (
              <div
                key={name}
                className="absolute left-0 flex items-center whitespace-pre rounded-pill border border-border bg-background text-foreground"
                style={{
                  backgroundColor: call > 0.01 ? `color-mix(in oklab, var(--foreground) ${(call * 100).toFixed(1)}%, var(--background))` : undefined,
                  color: call > 0.01 ? `color-mix(in oklab, var(--background) ${(call * 100).toFixed(1)}%, var(--foreground))` : undefined,
                  top: y,
                  height: CHIP_H,
                  padding: "0 34px",
                  fontSize: 36,
                  opacity: clamp(s / 0.08, 0, 1) * (1 - ease.out(progress(t, COLLAPSE_AT + 0.08, 0.16))),
                  transform: `translateY(${lerp(52, 0, pop)}px) scale(${lerp(0.82, 1, pop) * lerp(1, 0.94, collapse)})`,
                  transformOrigin: "0 50%",
                  letterSpacing: "-0.02em",
                }}
              >
                {name}
              </div>
            )
          })}

          {t >= COLLAPSE_AT + 0.08 && (
            <div
              className="absolute left-0 whitespace-pre text-foreground"
              style={{
                top: MID + CHIP_H / 2 - ROW / 2,
                height: ROW,
                lineHeight: `${ROW}px`,
                fontSize: BIG - 4,
                clipPath: cmdOut > 0 ? inset(cmdOut) : `inset(0 ${((1 - finalIn) * 100).toFixed(3)}% 0 0)`,
              }}
            >
              npx shadcn add <span className="text-accent">@fine/select</span>
            </div>
          )}
        </div>
      </div>

      <div className="absolute bg-border" style={{ left: 959, top: 0, width: 2, height: 1080, transformOrigin: "50% 0", transform: `scaleY(${1 - streamOut})` }} />
      <div
        className="absolute"
        style={{ left: STREAM.x, top: 0, width: STREAM.w, height: 1080, fontFamily: mono, fontSize: STREAM.size, letterSpacing: 0, clipPath: streamOut > 0 ? inset(streamOut) : undefined }}
      >
        {lines}
      </div>
      </div>
    </Scene>
  )
}

/** The block caret: solid while typing, blinking at 2Hz otherwise (the caller passes `on`). */
function Caret({ on, h }: { on: boolean; h: number }) {
  return <span className="inline-block bg-foreground align-middle" style={{ width: 6, height: h, marginLeft: 4, marginRight: -10, opacity: on ? 1 : 0 }} />
}
