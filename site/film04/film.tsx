"use client"

import { Stage, type FilmFont } from "@/site/film/Stage"
import { DURATION, SCENES } from "./timeline"

// Same weights as film 0.3: the faces are variable fonts, so asking for all of them costs nothing.
const WEIGHTS = [400, 500, 600, 700, 800]

/** /film/v04/: fine 0.4. `fonts` are the CSS variables of every face the three presets use (the route reads them from the tokens). */
export function Film04({ fonts }: { fonts: string[] }) {
  return <Stage scenes={SCENES} duration={DURATION} fonts={fonts.map<FilmFont>(variable => ({ variable, weights: WEIGHTS }))} />
}
