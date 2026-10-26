"use client"

import type { ReactNode } from "react"
import { Check } from "lucide-react"
import { Card } from "@/components/ui/card"
import { clamp, ease, progress } from "@/site/film/clock"
import { Caret, caretOn } from "./shared"

// The install shell: a Card in mono, two commands typed on the film clock, each answered by a check line that rises into place.
// The card is sized to its text (the longest command sets its width, each row opens as it arrives, so it grows with the session) and
// is CSS-zoomed 2x: the commands are 28px in the card's own pixels, 56px on the 1080p frame, with the card's padding, border and radius scaling along.
export const CMD1 = "npx shadcn add @fine/theme-poster"
export const CMD2 = "npx shadcn add @fine/dialog"
const TYPE1 = { at: 0.05, step: 0.018, enter: 0.7, ok: 0.78 }
const TYPE2 = { at: 1.2, step: 0.019, enter: 1.8, ok: 1.88 }
const FONT = 28
export const ZOOM = 2
const ROW = 40
const OK_ROW = 28
const OK_FONT = 18

const typed = (t: number, { at, step }: { at: number; step: number }, cmd: string) => (t < at ? 0 : clamp(Math.floor((t - at) / step) + 1, 0, cmd.length))

/** A row that opens to its height when `open` runs 0 to 1 (the card grows with it) and clips what is not there yet. */
function Row({ h, open, children }: { h: number; open: number; children: ReactNode }) {
  return (
    <div className="overflow-clip" style={{ height: h * open }}>
      {children}
    </div>
  )
}

function Line({ t, cmd, spec }: { t: number; cmd: string; spec: typeof TYPE1 }) {
  const n = typed(t, spec, cmd)
  const live = t < spec.enter
  return (
    <div className="whitespace-pre" style={{ height: ROW, lineHeight: `${ROW}px` }}>
      <span className="text-muted-foreground">$ </span>
      <span>{cmd.slice(0, n)}</span>
      {live && <Caret on={caretOn(t, n > 0 && n < cmd.length)} />}
    </div>
  )
}

function Ok({ t, at, label }: { t: number; at: number; label: string }) {
  const open = ease.outExpo(progress(t, at, 0.4))
  return (
    <Row h={OK_ROW} open={open}>
      <div className="flex items-center gap-2 text-muted-foreground" style={{ height: OK_ROW, fontSize: OK_FONT, transform: `translateY(${(1 - open) * 100}%)` }}>
        <Check className="text-accent" style={{ width: OK_FONT, height: OK_FONT }} strokeWidth={2.25} aria-hidden />
        <span>{label}</span>
      </div>
    </Row>
  )
}

export function Terminal({ t }: { t: number }) {
  return (
    <Card className="w-fit content-start gap-0 font-mono" style={{ fontSize: FONT, letterSpacing: "-0.03em", zoom: ZOOM }}>
      {/* the widest line, unseen, holds the card's width */}
      <div aria-hidden className="invisible h-0 whitespace-pre" style={{ lineHeight: 0 }}>{`$ ${CMD1}`}</div>
      <Line t={t} cmd={CMD1} spec={TYPE1} />
      <Ok t={t} at={TYPE1.ok} label="theme-poster installed" />
      <Row h={ROW} open={ease.outExpo(progress(t, TYPE1.ok + 0.1, 0.35))}>
        <Line t={t} cmd={CMD2} spec={TYPE2} />
      </Row>
      <Ok t={t} at={TYPE2.ok} label="dialog installed" />
    </Card>
  )
}
