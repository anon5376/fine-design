"use client"

import { Fragment } from "react"
import { Scene, type SceneProps } from "../scene"
import { bezier, clamp, ease, lerp, progress, remap, spring, springs } from "../clock"
import { DirectionalBlur } from "../blur"
import { fontStack } from "../wordmark"
import { AnimatedNumber } from "@/components/ui/animated-number"
import { WHIP, whipBlur, whipProgress } from "../s23/pan"
import { TILES } from "../s23/wall-tiles"

// S3 The wall 5.0-9.0, paper. The whip pan from S2 lands on bare paper; at 5.0 thirty tiles rise from below in a diagonal
// wave on a tilted board (perspective 2200, rotateX 52, rotateZ -28), each arriving with its real fine component (a slot
// never shows without its component). A long dolly crosses the board while a state ripple runs ahead of it: every tile's props step at its own
// time, so the components' own springs and transitions play. An ink panel slides in at the left with a counter built from
// the real AnimatedNumber: 00 up to 42 components, then on the 8.0 beat the whole block wipes (vertical mask) to 7 blocks. Hard cut to S4 at 9.0, on the beat.
// Local t = film - 5.

const COLS = 6
const ROWS = 5
const TW = 340
const TH = 210
const GAP = 44
const PX = TW + GAP
const PY = TH + GAP
const BW = COLS * PX - GAP
const BH = ROWS * PY - GAP
const PERSPECTIVE = 2200

const PANEL = 680
const DEPTH = 14 // slab thickness
const SWAP_AT = 3.0 // the 8.0 beat
const SWAP_DUR = 0.5
const COUNTER_H = 420 // 360 of digits + 20 gap + 40 label
const RISE_STAGGER = 0.04
const RIPPLE = { start: 0.9, dur: 2.7 } // local seconds

// Camera path in board coordinates (px from the board centre), and the ripple's front along the same direction.
const P0 = { x: -330, y: -170 }
const P1 = { x: 700, y: 330 }
const PATH = Math.hypot(P1.x - P0.x, P1.y - P0.y)
const DIR = { x: (P1.x - P0.x) / PATH, y: (P1.y - P0.y) / PATH }
// gentler than ease.inOut: a lower peak speed keeps the tile text readable under the shutter
const dolly = bezier(0.4, 0, 0.6, 1)
const S_FRONT = { from: -560, to: 1160 }

const tiles = TILES.map((def, i) => {
  const r = Math.floor(i / COLS)
  const c = i % COLS
  const cx = c * PX + TW / 2 - BW / 2
  const cy = r * PY + TH / 2 - BH / 2
  const s = cx * DIR.x + cy * DIR.y
  const tr = RIPPLE.start + RIPPLE.dur * clamp((s - S_FRONT.from) / (S_FRONT.to - S_FRONT.from))
  return { def, r, c, x: c * PX, y: r * PY, tr, rise: (r + c) * RISE_STAGGER }
})

export function S3Wall({ t }: SceneProps) {
  const film = t + 5
  const mono = fontStack("mono")
  const sans = fontStack("sans")

  // The whip: the board slides in from the right on S2's curve and its blur.
  const pan = whipProgress(film)
  const blur = whipBlur(film)
  const slide = WHIP.dist * (1 - pan)

  // Camera: one long eased dolly across the board, a push in, a slow yaw, and a shift that makes room for the panel.
  const cam = dolly(progress(t, 0.35, 3.5))
  const px = lerp(P0.x, P1.x, cam)
  const py = lerp(P0.y, P1.y, cam)
  const dz = lerp(260, 640, cam)
  const yaw = lerp(-29, -25, cam)
  const tilt = lerp(52, 54, cam)
  const shift = lerp(0, PANEL / 2 - 20, ease.outExpo(progress(t, 0.45, 0.9)))

  const sy = lerp(-40, -150, cam)
  const panelIn = ease.outExpo(progress(t, 0.45, 0.75))

  // The counter: 00 -> 42 "components" in a few clean jumps (each far enough apart for the roll to settle), then on the 8.0 beat
  // (t = 3.0) the whole block is wiped away by a vertical mask edge that sweeps upward and "7 blocks" is revealed behind it.
  // The two blocks are separate layers, so a number is never on screen under the other block's label.
  const steps = (list: [number, number][], from: number) => list.reduce((v, [at, to]) => (t >= at ? to : v), from)
  const up = steps([[0.85, 9], [1.1, 18], [1.35, 27], [1.6, 36], [1.85, 42]], 0)
  const label = remap(ease.outExpo(progress(t, 0.95, 0.5)), 0, 1, 48, 0)
  const w = ease.outExpo(progress(t, SWAP_AT, SWAP_DUR))

  return (
    <Scene theme="light" bg={t >= 0}>
      <DirectionalBlur x={blur} className="absolute inset-0" style={{ transform: `translateX(${slide}px)`, opacity: clamp(pan / 0.12) }}>
        <div className="absolute inset-0" style={{ perspective: PERSPECTIVE }}>
          <div
            className="absolute"
            style={{
              left: (1920 - BW) / 2,
              top: (1080 - BH) / 2,
              width: BW,
              height: BH,
              transformStyle: "preserve-3d",
              transform: `translate3d(${shift}px, ${sy}px, ${dz}px) rotateX(${tilt}deg) rotateZ(${yaw}deg) translate(${-px}px, ${-py}px)`,
            }}
          >
            {tiles.map(({ def, x, y, tr, rise }) => {
              const f = spring(t - rise, springs.expressive)
              const opacity = clamp((t - rise) / 0.22)
              const since = progress(t, tr, 0.7)
              const bump = since > 0 && since < 1 ? Math.sin(Math.PI * since) ** 1.5 * 26 : 0
              const flash = since > 0 && since < 1 ? 1 - ease.out(since) : 0
              const scale = def.scale ?? 1.25
              const Content = def.Content
              const z = lerp(-500, 0, f) + bump
              const wall = "absolute bg-secondary"
              return (
                <Fragment key={def.id}>
                  {opacity > 0 && (
                    <div className="absolute" style={{ left: x, top: y, width: TW, height: TH, transformStyle: "preserve-3d", transform: `translateZ(${z}px)` }}>
                      {/* slab sides: bottom and top lit, left and right in shade */}
                      <div className="absolute bg-secondary-hover" style={{ left: 0, top: TH, width: TW, height: DEPTH, opacity, transformOrigin: "0 0", transform: "rotateX(-90deg)" }} />
                      <div className="absolute bg-secondary-hover" style={{ left: 0, top: -DEPTH, width: TW, height: DEPTH, opacity, transformOrigin: "0 100%", transform: "rotateX(90deg)" }} />
                      <div className={wall} style={{ left: TW, top: 0, width: DEPTH, height: TH, opacity, transformOrigin: "0 0", transform: "rotateY(90deg)" }} />
                      <div className={wall} style={{ left: -DEPTH, top: 0, width: DEPTH, height: TH, opacity, transformOrigin: "100% 0", transform: "rotateY(-90deg)" }} />
                      <div
                        className="absolute inset-0 flex items-center justify-center rounded-container border bg-surface"
                        style={{ opacity, borderColor: `color-mix(in oklch, var(--foreground) ${Math.round(flash * 60)}%, var(--border))` }}
                      >
                        <div style={{ width: 240, transform: `scale(${scale})` }}>
                          <Content {...def.drive(t, tr)} />
                        </div>
                      </div>
                    </div>
                  )}
                </Fragment>
              )
            })}
          </div>
        </div>
      </DirectionalBlur>

      {/* the ink panel: flat, over the board */}
      {t >= 0 && (
        <div className="dark absolute inset-y-0 left-0 overflow-hidden bg-background text-foreground" style={{ width: PANEL, transform: `translateX(${-(1 - panelIn) * PANEL}px)` }}>
          <div className="absolute" style={{ left: 88, top: 0, bottom: 0, width: PANEL - 120 }}>
            <div className="absolute left-0 w-full" style={{ top: "50%", marginTop: -COUNTER_H * 0.58, height: COUNTER_H }}>
              {/* the edge of the mask sits at (1 - w) of the height and sweeps up: the old block keeps the part above it, the new one the part below */}
              {w < 1 && (
                <div className="absolute inset-0" style={{ clipPath: `inset(0 0 ${(w * 100).toFixed(3)}% 0)` }}>
                  <div className="absolute inset-0" style={{ transform: `translateY(${-w * 36}px)` }}>
                    <Counter value={up} digits={2} word="components" wordY={label} sans={sans} mono={mono} />
                  </div>
                </div>
              )}
              {w > 0 && (
                <div className="absolute inset-0" style={{ clipPath: `inset(${((1 - w) * 100).toFixed(3)}% 0 0 0)` }}>
                  <div className="absolute inset-0" style={{ transform: `translateY(${(1 - w) * 36}px)` }}>
                    <Counter value={7} digits={1} word="blocks" wordY={0} sans={sans} mono={mono} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Scene>
  )
}

/** One counter block: the big AnimatedNumber over a mono label. `wordY` slides the label inside its clip (0 = settled). */
function Counter({ value, digits, word, wordY, sans, mono }: { value: number; digits: number; word: string; wordY: number; sans: string; mono: string }) {
  return (
    <div className="absolute inset-0">
      <AnimatedNumber value={value} format={{ minimumIntegerDigits: digits }} className="font-semibold leading-none" style={{ fontFamily: sans, fontSize: 400, lineHeight: 0.9 }} />
      <div className="relative mt-5 h-10 overflow-hidden text-muted-foreground" style={{ fontFamily: mono, fontSize: 30, lineHeight: "40px" }}>
        <div className="absolute left-0 top-0 whitespace-pre" style={{ transform: `translateY(${wordY}px)` }}>
          {word}
        </div>
      </div>
    </div>
  )
}
