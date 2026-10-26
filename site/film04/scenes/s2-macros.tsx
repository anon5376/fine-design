"use client"

import type { SceneProps } from "@/site/film/scene"
import { MACROS } from "../macros"
import { MACRO_LENGTH } from "../macros/kit"

// s2 2.0-17.0: ten macro close-ups of 1.5 s with hard cuts on the beats (every 1.5 s, so on beat 3 of each bar of 3). Each macro owns its
// preset, scheme and camera, and gets local time 0..1.5. The key remounts a macro at its cut, so none carries state from the one before.
export function S2Macros({ t }: SceneProps) {
  const i = Math.min(MACROS.length - 1, Math.max(0, Math.floor(t / MACRO_LENGTH)))
  const { slug, Component } = MACROS[i]
  return <Component key={slug} t={t - i * MACRO_LENGTH} />
}
