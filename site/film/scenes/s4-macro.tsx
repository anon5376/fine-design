"use client"

import { Scene, type SceneProps } from "../scene"
import { MacroBalance } from "../s456/macro-balance"
import { MacroSelect } from "../s456/macro-select"
import { MacroToasts } from "../s456/macro-toasts"

// S4 Macro (9.0-13.0), ink. Three close-ups, hard cuts on beats: the balance rolls (9.0-10.0), a Select picks (10.0-11.5),
// three toasts stack (11.5-13.0). The storyboard's 10.3 and 11.6 are moved to 10.0 and 11.5 so every cut lands on a beat.
const CUT_B = 1.0
const CUT_C = 2.5

export function S4Macro({ t }: SceneProps) {
  return (
    <Scene theme="dark">
      {t < CUT_B ? <MacroBalance t={t} /> : t < CUT_C ? <MacroSelect t={t - CUT_B} /> : <MacroToasts t={t - CUT_C} />}
    </Scene>
  )
}
