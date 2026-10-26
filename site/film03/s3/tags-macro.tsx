"use client"

import { useLayoutEffect, useRef, useState } from "react"
import { Tag } from "@/components/ui/tag"
import { ease, lerp, progress, spring, type SpringSpec } from "@/site/film/clock"
import { MacroFrame, CenterBox, unitOf } from "./frame"
import { Pointer } from "./pointer"

// s3 macro 2, 9.5-11.0, Folio light: five Tags in a centred TagList, two removed 0.5s apart.
// The real tags, laid out like a flex-wrap TagList with justify-center (gap 8px, 24px rows, each row centred) from their measured widths and
// driven by the film clock: the removed tag leaves on the fast tier's exit (opacity and scale to 0.5, ease-exit) from where it stood, and its
// siblings glide to their new slots on the moderate spring, position only. Mobile (row 2) goes first: Finance slides along its row. Docs
// (end of row 1) goes second: Finance wraps up into the gap, along its row first and up after, so it never passes under a neighbour.
// The list is laid out at its natural size and CSS-zoomed (CenterBox), so the tag labels are drawn at 72px on the 1080p frame.
const LABELS = ["Dashboard", "Marketing", "Docs", "Mobile", "Finance"]
const GAP = 8
const ROW = 24
const R1 = 0.5 // Mobile removed
const R2 = 1.0 // Docs removed
const REMOVED: Record<number, number> = { 3: R1, 2: R2 }
const GLIDE: SpringSpec = { visualDuration: 0.32, bounce: 0 } // moderate, 2x
const RISE_LAG = 0.15 // a tag that wraps up a row rises this long after it starts to slide
const LEAVE = 0.12 // fast exit (60ms), 2x
const K = 6

type Pos = { x: number; y: number }

/** flex-wrap with justify-center: tags in order, a new row when the next one does not fit, each row centred in W. Rows stay at the top of the box. */
function flow(ids: number[], w: number[], W: number): Map<number, Pos> {
  const rows: number[][] = [[]]
  let x = 0
  for (const id of ids) {
    if (x > 0 && x + w[id] > W) {
      rows.push([])
      x = 0
    }
    rows[rows.length - 1].push(id)
    x += w[id] + GAP
  }
  const out = new Map<number, Pos>()
  rows.forEach((row, r) => {
    const width = row.reduce((sum, id) => sum + w[id], 0) + GAP * (row.length - 1)
    let rx = (W - width) / 2
    for (const id of row) {
      out.set(id, { x: rx, y: r * (ROW + GAP) })
      rx += w[id] + GAP
    }
  })
  return out
}

export function TagsMacro({ t }: { t: number }) {
  const els = useRef<(HTMLDivElement | null)[]>([])
  const unit = useRef<HTMLDivElement>(null)
  const [m, setM] = useState<{ w: number[]; W: number } | null>(null)
  useLayoutEffect(() => {
    const u = unitOf(unit.current!)
    const w = els.current.map(el => el!.offsetWidth / u)
    // Wide enough for Dashboard, Marketing and Docs on the first row, and for Dashboard, Marketing and Finance once Mobile and Docs are gone;
    // Mobile does not fit beside Docs, so it wraps with Finance.
    setM({ w, W: Math.max(w[0] + w[1] + w[2], w[0] + w[1] + w[4]) + 2 * GAP + 4 })
  }, [])

  const W = m?.W ?? 290
  const H = ROW * 2 + GAP
  const w = m?.w ?? LABELS.map(() => 80)
  const L0 = flow([0, 1, 2, 3, 4], w, W)
  const L1 = flow([0, 1, 2, 4], w, W)
  const L2 = flow([0, 1, 4], w, W)
  // The glide is additive per leg (a -> b at R1, b -> c at R2). A leg that goes up a row rises after it has slid sideways.
  const leg = (from: Pos, to: Pos, at: number): Pos => {
    const lag = to.y < from.y - 0.5 ? RISE_LAG : 0
    return { x: (to.x - from.x) * spring(t - at, GLIDE), y: (to.y - from.y) * spring(t - at - lag, GLIDE) }
  }
  const at = (i: number): Pos => {
    const a = L0.get(i)!
    const b = L1.get(i)
    const c = L2.get(i)
    if (!b) return a
    const d1 = leg(a, b, R1)
    const d2 = c ? leg(b, c, R2) : { x: 0, y: 0 }
    return { x: a.x + d1.x + d2.x, y: a.y + d1.y + d2.y }
  }

  // The remove button's centre: right edge of the tag minus its 2px padding and half the 20px button.
  const target = (i: number, from: Map<number, Pos>): Pos => ({ x: from.get(i)!.x + w[i] - 12, y: from.get(i)!.y + ROW / 2 })
  const t1 = target(3, L0)
  const t2 = target(2, L1)
  const k = ease.out(progress(t, 0, 0.5))
  const first = { x: lerp(t1.x + 150, t1.x, k), y: lerp(t1.y + 110, t1.y, k) }
  // From Mobile's button to Docs's: up into the gap between the rows, along it, then up to the button, so the dot never crosses a label.
  const s = progress(t, 0.66, R2 - 0.66)
  const gapY = ROW + GAP / 2
  const y = s < 0.3 ? lerp(t1.y, gapY, ease.out(s / 0.3)) : s < 0.7 ? gapY : lerp(gapY, t2.y, ease.in(progress(s, 0.7, 0.3)))
  const pos = t < 0.66 ? first : { x: lerp(t1.x, t2.x, ease.inOut(progress(s, 0.1, 0.8))), y }
  const press = t < 0.8 ? t - R1 : t - R2

  const p = progress(t, 0, 1.5)
  const cam = { s: lerp(0.95, 1.03, ease.out(p)), ry: lerp(-5, 3, ease.out(p)), rx: lerp(2, -1.5, ease.out(p)), y: 0, p: 2400 }

  return (
    <MacroFrame preset="folio" scheme="light" t={t} cam={cam} caption="TagList">
      {/* rows stay at the top of the box, so the box sits a little low: the two-row list and the one-row list then straddle the frame's centre */}
      <div className="absolute inset-0" style={{ transform: `translateY(${4 * K}px)` }}>
        <CenterBox w={W} h={H} zoom={K}>
          <div className="relative" style={{ width: W, height: H, opacity: m ? 1 : 0 }}>
            <div ref={unit} className="invisible absolute" style={{ width: 100, height: 0 }} />
            {LABELS.map((label, i) => {
              const removed = i in REMOVED ? t - REMOVED[i] : -1
              const o = removed < 0 ? 0 : ease.exit(progress(removed, 0, LEAVE))
              if (o >= 1) return null
              const p = at(i)
              const hover = i in REMOVED ? progress(t, REMOVED[i] - 0.14, 0.1) : 0
              return (
                <div
                  key={label}
                  ref={el => {
                    els.current[i] = el
                  }}
                  className="absolute left-0 top-0"
                  style={{ transform: `translate(${p.x}px, ${p.y}px) scale(${lerp(1, 0.5, o)})`, opacity: 1 - o, transformOrigin: "50% 50%" }}
                >
                  <Tag onRemove={() => {}}>{label}</Tag>
                  <div className="absolute right-0.5 top-0.5 size-5 rounded-small bg-hover" style={{ opacity: hover }} />
                </div>
              )
            })}
            {m && <Pointer x={pos.x} y={pos.y} k={K} press={press} opacity={1 - progress(t, 1.18, 0.2)} />}
          </div>
        </CenterBox>
      </div>
    </MacroFrame>
  )
}
