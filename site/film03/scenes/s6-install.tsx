"use client"

import type { SceneProps } from "@/site/film/scene"
import { ease, lerp, progress, spring, type SpringSpec } from "@/site/film/clock"
import { PresetScene, PresetScope } from "../preset-scope"
import { PreviewLayer, WINDOW } from "../s456/preview"
import { Terminal } from "../s456/terminal"

// s6 19-21.5: Install a theme once, ink. A terminal Card on top, a small app in Ledger below. "npx shadcn add @fine/theme-poster" types and
// on enter (t 0.7 = 19.7) the app crossfades to Poster (moderate, slowed to 0.28s). "npx shadcn add @fine/dialog" types from t 1.2 and
// on enter (1.8 = 20.8) a Dialog opens over the app on the slow tier with its bounce, still Poster: adding a component did not re-skin
// anything. From the moment the dialog opens (to the cut at 21.5) the camera pushes into it (and recentres on it) while the terminal clears out of the way.
// s5 ends Poster dark and this is ink, so the cut is dark to dark.
// The app window is laid out at its natural size and CSS-zoomed (WZ), so the dialog's type and buttons are drawn at their final size.
const OPEN = 1.8
const SLOW: SpringSpec = { visualDuration: 0.48, bounce: 0.22 } // slow tier slowed 2x
const WZ = 2.4
const WIN = { w: WINDOW.w * WZ, h: WINDOW.h * WZ } // 912 x 600 on the frame
const WIN_TOP = 1080 - 48 - WIN.h
const FOCUS = { x: 960, y: WIN_TOP + WIN.h / 2 } // the dialog's centre, and the camera's centre of push
const PUSH = 1.6

export function S6Install({ t }: SceneProps) {
  const poster = ease.inOut(progress(t, 0.7, 0.28))
  const pop = spring(t - OPEN, SLOW)
  const dialog = t >= OPEN ? { opacity: ease.enter(progress(t, OPEN, 0.32)), scale: lerp(0.97, 1, pop), scrim: ease.enter(progress(t, OPEN, 0.3)) } : undefined
  const move = ease.inOut(progress(t, OPEN + 0.05, 0.65))
  const push = lerp(1, PUSH, move)
  const drift = 1 + 0.02 * progress(t, 0, OPEN)
  const termOut = 1 - ease.inOut(progress(t, OPEN + 0.1, 0.3))
  return (
    <PresetScene preset="ledger" scheme="dark">
      <div className="absolute inset-0" style={{ transform: `translate(0px, ${(540 - FOCUS.y) * move}px) scale(${drift * push})`, transformOrigin: `${FOCUS.x}px ${FOCUS.y}px` }}>
        <PresetScope preset="ledger" scheme="dark" className="absolute inset-x-0 flex justify-center" style={{ top: 48, opacity: termOut }}>
          <Terminal t={t} />
        </PresetScope>
        <div className="absolute" style={{ left: 960 - WIN.w / 2, top: WIN_TOP, width: WIN.w, height: WIN.h }}>
          <div className="absolute left-0 top-0" style={{ width: WINDOW.w, height: WINDOW.h, zoom: WZ }}>
            {poster < 1 && <PreviewLayer preset="ledger" />}
            {t >= 0.7 && (
              <div className="absolute inset-0" style={{ opacity: poster }}>
                <PreviewLayer preset="poster" dialog={dialog} />
              </div>
            )}
          </div>
        </div>
      </div>
    </PresetScene>
  )
}
