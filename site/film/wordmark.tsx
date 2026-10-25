"use client"

import { useId } from "react"
import { lerp, spring, type SpringSpec } from "./clock"

// "fine" as the film draws it: Geist 600, tracking -0.04em, set in SVG so one coordinate system holds the letters,
// the ring, the camera and the underline. The i is a dotless i plus a round tittle, so the dot can move alone.
// Glyph advances and ink bounds come from canvas measureText on the loaded font, so layout never waits on the DOM.

const LETTERS = ["f", "ı", "n", "e"] as const
const TRACKING = -0.04

export type WordmarkMetrics = {
  size: number
  glyphs: { ch: string; x: number }[]
  /** Ink box relative to the first glyph's origin (x) and the baseline (y, negative is up). The tittle counts as ink. */
  ink: { left: number; right: number; top: number; bottom: number; width: number }
  /** The word's x-height line and f's cap height, for layout. */
  xHeight: number
  ascent: number
  tittle: { cx: number; cy: number; r: number }
}

/** The CSS font stack next/font resolved for --font-geist-sans / --font-geist-mono. */
export function fontStack(kind: "sans" | "mono"): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(`--font-geist-${kind}`).trim()
  return v || (kind === "sans" ? "Geist, system-ui, sans-serif" : "'Geist Mono', ui-monospace, monospace")
}

const cache = new Map<number, WordmarkMetrics>()

/** Needs the Geist font loaded (the Stage waits for it). Cached per size. */
export function measureWordmark(size: number): WordmarkMetrics {
  const hit = cache.get(size)
  if (hit) return hit
  const ctx = document.createElement("canvas").getContext("2d")!
  ctx.font = `600 ${size}px ${fontStack("sans")}`
  ctx.fontKerning = "none"
  let x = 0
  const glyphs = LETTERS.map(ch => {
    const g = { ch, x }
    x += ctx.measureText(ch).width + TRACKING * size
    return g
  })
  const box = (ch: string) => {
    const m = ctx.measureText(ch)
    return { l: -m.actualBoundingBoxLeft, r: m.actualBoundingBoxRight, up: m.actualBoundingBoxAscent, down: m.actualBoundingBoxDescent }
  }
  const f = box("f")
  const dotless = box("ı")
  const dotted = box("i")
  const stem = dotless.r - dotless.l
  // Geist's tittle is a circle a little wider than the stem, its top where the real i's top is.
  const r = (stem * 1.08) / 2
  const cx = glyphs[1].x + (dotless.l + dotless.r) / 2
  const cy = -dotted.up + r
  const last = glyphs[3]
  const e = box("e")
  const ink = {
    left: glyphs[0].x + f.l,
    right: last.x + e.r,
    top: -Math.max(f.up, dotted.up),
    bottom: Math.max(e.down, 0),
    width: 0,
  }
  ink.width = ink.right - ink.left
  const out: WordmarkMetrics = { size, glyphs, ink, xHeight: dotless.up, ascent: f.up, tittle: { cx, cy, r } }
  cache.set(size, out)
  return out
}

/** Per-letter vertical offsets (px, 0 at rest, `size * 1.1` fully hidden below the baseline) for a staggered rise. */
export function riseOffsets(m: WordmarkMetrics, t: number, start: number, stagger: number, spec: SpringSpec): number[] {
  return m.glyphs.map((_, i) => lerp(m.size * 1.1, 0, spring(t - start - i * stagger, spec)))
}

export type TittleState = { dx?: number; dy?: number; scale?: number; fill?: string }

/**
 * Draws the word with its origin placed so the ink box is centred on (cx, baselineY - inkHeight/2 is NOT applied:
 * y is the baseline). Each letter is clipped at the baseline, so a letter that is lifted below it is hidden: the mask.
 * Render inside an <svg viewBox="0 0 1920 1080">.
 */
export function Wordmark({
  m,
  cx,
  baseline,
  lift,
  tittle,
  fill = "var(--foreground)",
}: {
  m: WordmarkMetrics
  /** Stage x the ink box is centred on. */
  cx: number
  /** Stage y of the baseline. */
  baseline: number
  /** Per-letter offsets from riseOffsets (px below rest). */
  lift: number[]
  tittle: TittleState & { hidden?: boolean }
  fill?: string
}) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "")
  const ox = cx - (m.ink.left + m.ink.right) / 2
  const s = m.size
  const { dx = 0, dy = 0, scale = 1, fill: dot = fill } = tittle
  return (
    <g transform={`translate(${ox} ${baseline})`}>
      <defs>
        {/* Letter-local space: the mask ends 2% of the size under the baseline so round bottoms keep their overshoot. */}
        <clipPath id={`m${id}`}>
          <rect x={-s} y={-s * 1.4} width={s * 3} height={s * 1.4 + s * 0.02} />
        </clipPath>
      </defs>
      {m.glyphs.map((g, i) => (
        <g key={g.ch} transform={`translate(${g.x} 0)`} clipPath={`url(#m${id})`}>
          <text
            transform={`translate(0 ${lift[i]})`}
            style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: s, fill, fontKerning: "none", textRendering: "geometricPrecision" }}
          >
            {g.ch}
          </text>
        </g>
      ))}
      {!tittle.hidden && (
        <g transform={`translate(${m.tittle.cx + dx} ${m.tittle.cy + dy}) scale(${scale})`}>
          <circle r={m.tittle.r} style={{ fill: dot }} />
        </g>
      )}
    </g>
  )
}
