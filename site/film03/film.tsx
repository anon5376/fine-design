"use client"

import { Stage, type FilmFont } from "@/site/film/Stage"
import { DURATION, SCENES } from "./timeline"

// Every weight any scene may set. The faces are variable fonts (one file per subset), so asking for all of them costs nothing
// and a scene that picks another weight in this range never meets a face that is not there yet.
const WEIGHTS = [400, 500, 600, 700, 800]

/** /film/v03/: fine 0.3. `fonts` are the CSS variables of every face the three presets use (the route reads them from the tokens). */
export function Film03({ fonts }: { fonts: string[] }) {
  return <Stage scenes={SCENES} duration={DURATION} fonts={fonts.map<FilmFont>(variable => ({ variable, weights: WEIGHTS }))} />
}
