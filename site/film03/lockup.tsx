"use client"

import { useId } from "react"
import { FILM } from "@/site/film/clock"
import { fontStack, measureWordmark, type WordmarkMetrics } from "@/site/film/wordmark"

// The film's lockup: the "fine" wordmark with its version in figures to the right, the digits as tall as the f, the whole set centred
// on the frame with the cobalt underline under the word. s1 (0.2 to 0.3) and s7 (out) lay out from the same numbers, so the lockup sits
// in the same place at both ends of the film. Needs Geist and Geist Mono loaded (the Stage waits). Coordinates are stage pixels.

const TRACKING = -0.06 // em
const WEIGHT = 400
// The mono dot gets a full digit's width, which spaces "0.3" out like a serial number. It keeps 60% of it, centred on its ink.
const DOT = 0.6

export type Lockup = {
  word: WordmarkMetrics
  /** Stage x the word's ink box is centred on (pass to <Wordmark cx>). */
  wordCx: number
  /** Stage y of the baseline shared by the word and the figures. */
  baseline: number
  underline: { x: number; y: number; w: number; h: number }
  figures: {
    /** Font size at which a digit is as tall as the f. */
    size: number
    /** Stage x of each glyph's origin. */
    x: number[]
    /** A glyph cell: the box a rolling or rising digit is clipped to, from the cap line down to the baseline like the word's masks. Travel one `cellH` to be fully out of it. */
    cellTop: number
    cellH: number
    advance: number
  }
}

const cache = new Map<string, Lockup>()

/**
 * `below` is the height of anything stacked under the underline (s7's URL line) that the centring should include, in px.
 * Figures are Geist Mono, which is what Ledger's --font-figure is.
 */
export function measureLockup(size: number, version: string, below = 0): Lockup {
  const key = `${size}/${version}/${below}`
  const hit = cache.get(key)
  if (hit) return hit
  const word = measureWordmark(size)
  const ctx = document.createElement("canvas").getContext("2d")!
  const stack = fontStack("mono")
  ctx.font = `${WEIGHT} 100px ${stack}`
  const fs = (word.ascent * 100) / ctx.measureText("0").actualBoundingBoxAscent
  ctx.font = `${WEIGHT} ${fs}px ${stack}`
  ctx.fontKerning = "none"
  const advance = ctx.measureText("0").width
  let pen = 0
  const origin = [...version].map(ch => {
    const a = ch === "." ? advance * DOT : advance
    const o = pen - (advance - a) / 2
    pen += a + TRACKING * fs
    return o
  })
  const first = ctx.measureText(version[0])
  const last = ctx.measureText(version[version.length - 1])
  const inkLeft = origin[0] - first.actualBoundingBoxLeft
  const inkRight = origin[origin.length - 1] + last.actualBoundingBoxRight

  const gap = size * 0.2
  const total = word.ink.width + gap + (inkRight - inkLeft)
  const left = FILM.width / 2 - total / 2
  const gapLine = size * 0.17
  const h = Math.round(size * 0.04)
  const inkH = -word.ink.top
  const groupH = inkH + gapLine + h + below
  const baseline = FILM.height / 2 - groupH / 2 + inkH
  const x0 = left + word.ink.width + gap - inkLeft
  const cellH = word.ascent * 1.35 + size * 0.02
  const out: Lockup = {
    word,
    wordCx: left + word.ink.width / 2,
    baseline,
    underline: { x: left, y: baseline + gapLine, w: word.ink.width, h },
    figures: { size: fs, x: origin.map(o => x0 + o), cellTop: baseline - word.ascent * 1.35, cellH, advance },
  }
  cache.set(key, out)
  return out
}

export type FigureLayer = {
  /** Which glyph cell (0 is the first character of the version). Two layers on one cell are a digit rolling out and its replacement. */
  index: number
  ch: string
  /** Vertical offset in px from the baseline; the glyph is clipped to its cell, so +cellH is hidden below and -cellH above. */
  dy?: number
  fill: string
  opacity?: number
}

/** The version's glyphs, each clipped to its cell like the wordmark's letters. Render inside an <svg viewBox="0 0 1920 1080">. */
export function Figures({ lockup, layers }: { lockup: Lockup; layers: FigureLayer[] }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "")
  const { figures: f, baseline } = lockup
  const pad = f.size * 0.03
  return (
    <>
      <defs>
        {f.x.map((x, i) => (
          <clipPath key={i} id={`f${id}${i}`}>
            <rect x={x - pad} y={f.cellTop} width={f.advance + pad * 2} height={f.cellH} />
          </clipPath>
        ))}
      </defs>
      {layers.map(({ index, ch, dy = 0, fill, opacity = 1 }, i) => (
        <g key={i} clipPath={`url(#f${id}${index})`} opacity={opacity}>
          <text
            x={f.x[index]}
            y={baseline + dy}
            style={{ fontFamily: "var(--font-figure)", fontWeight: WEIGHT, fontSize: f.size, fill, fontKerning: "none", fontVariantNumeric: "tabular-nums", textRendering: "geometricPrecision" }}
          >
            {ch}
          </text>
        </g>
      ))}
    </>
  )
}
