"use client"

import type { SceneProps } from "@/site/film/scene"
import { AvatarMacro } from "../s3/avatar-macro"
import { NumberMacro } from "../s3/number-macro"
import { SliderMacro } from "../s3/slider-macro"
import { TagsMacro } from "../s3/tags-macro"

// s3 8-14: Animations. Four macro close-ups of 1.5s with hard cuts on the beats (9.5, 11.0, 12.5): the scheme alternates
// light, light, dark, dark, so each cut changes the frame's colour on purpose. Each macro owns its preset and camera.
const MACRO = 1.5
const MACROS = [NumberMacro, TagsMacro, SliderMacro, AvatarMacro]

export function S3Macros({ t }: SceneProps) {
  const i = Math.min(MACROS.length - 1, Math.max(0, Math.floor(t / MACRO)))
  const Macro = MACROS[i]
  return <Macro t={t - i * MACRO} />
}
