"use client"

import type { CSSProperties } from "react"
import { fontStack } from "@/site/film/wordmark"

export const CAPTION_SIZE = 32

/** Mono caption bottom-left, the film's component label: one place and one style in s3 to s5 (32px on the 1080p frame). Color follows the scope it sits in. */
export function Caption({ children, opacity = 1 }: { children: string; opacity?: number }) {
  return (
    <div className="absolute text-muted-foreground" style={{ left: 96, bottom: 84, fontFamily: fontStack("mono"), fontSize: CAPTION_SIZE, letterSpacing: "-0.01em", opacity }}>
      {children}
    </div>
  )
}

/** Text caret: solid while typing, 2Hz blink otherwise (driven by the film time, so a render and a live play agree). */
export const caretOn = (t: number, typing: boolean) => typing || Math.floor(t * 4) % 2 === 0

export function Caret({ on, style }: { on: boolean; style?: CSSProperties }) {
  return <span aria-hidden className="inline-block bg-foreground align-text-bottom" style={{ width: "0.09em", height: "1.1em", opacity: on ? 1 : 0, ...style }} />
}
