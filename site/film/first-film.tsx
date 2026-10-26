"use client"

import { Stage, type FilmFont } from "./Stage"
import { DURATION, SCENES } from "./timeline"

// Geist is the only face the first film sets; the weights are the ones its scenes use.
const FONTS: FilmFont[] = [
  { variable: "--font-geist-sans", weights: [400, 500, 600, 700], fallback: "Geist, system-ui, sans-serif" },
  { variable: "--font-geist-mono", weights: [400, 500, 600], fallback: "'Geist Mono', ui-monospace, monospace" },
]

/** /film: the launch film. The route is a server component, so the scene list (functions) is bound here, on the client side. */
export function Film() {
  return <Stage scenes={SCENES} duration={DURATION} fonts={FONTS} />
}
