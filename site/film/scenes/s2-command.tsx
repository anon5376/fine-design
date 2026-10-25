"use client"

import { useLayoutEffect, useRef, useState } from "react"
import { Scene, type SceneProps } from "../scene"
import { ease, lerp, progress, remap, spring, springs } from "../clock"
import { DirectionalBlur } from "../blur"
import { fontStack } from "../wordmark"
import { Button } from "@/components/ui/button"
import { WHIP, whipBlur, whipProgress } from "../s23/pan"

// S2 One command 2.0-5.0, paper. A command types, Enter squashes it away, a real Button drops in at 4x on the expressive
// spring and takes a press beat, then multiplies: five variants fan out from behind it, the sizes cascade underneath,
// a press wave runs along the row, and at 4.7 the whole frame whips left into S3's board.
// Local t = film - 2. Beats: 0.95 Enter, 1.05 drop, 1.40 press, 1.70 fan-out, 2.70 whip.

const CMD = "npx shadcn add @fine/button"
const SCOPE = "npx shadcn add ".length
const SIZE = 100
const TYPE_START = 0.05
const TYPE_END = 0.95 // 27 characters in 0.9s: 30 per second on average, uneven like a hand

// Human pacing: each character gets a weight, then the schedule is scaled to end exactly at TYPE_END.
const frac = (x: number) => x - Math.floor(x)
const typedAt = (() => {
  const w = [...CMD].map((ch, i) => (ch === " " ? 1.5 : 0.65 + 0.7 * frac(Math.sin(i * 12.9898) * 43758.5453)))
  const sum = w.reduce((a, b) => a + b, 0)
  let at = TYPE_START
  return w.map(x => (at += ((TYPE_END - TYPE_START) * x) / sum))
})()

const VARIANTS = [
  { variant: "primary", label: "Send" },
  { variant: "secondary", label: "Schedule" },
  { variant: "outline", label: "Save draft" },
  { variant: "ghost", label: "Cancel" },
  { variant: "danger", label: "Void payment" },
] as const
const SIZES = ["sm", "md", "lg"] as const
const ROW1 = -34
const ROW2 = 40

/** Pulses 1 -> dip -> overshoot -> 1: a press that releases on a spring. */
const press = (t: number, at: number, depth: number) => 1 - depth * ease.out(progress(t, at, 0.06)) * (1 - spring(t - at - 0.06, springs.expressive))

export function S2Command({ t }: SceneProps) {
  const film = t + 2
  const mono = fontStack("mono")

  // ---- the command ----
  const typed = typedAt.filter(at => at <= t).length
  const typing = t >= TYPE_START && t < TYPE_END + 0.02
  const caret = t < 0.95 && (typing || Math.floor(t * 4) % 2 === 0)
  const out = ease.in(progress(t, 0.95, 0.17))
  const push = lerp(1, 1.035, ease.out(progress(t, 0, 0.95)))

  // ---- the button and its family ----
  const drop = spring(t - 1.05, springs.expressive)
  const dropY = lerp(-210, 0, drop)
  const vel = (lerp(-210, 0, spring(t - 1.05 + 0.004, springs.expressive)) - lerp(-210, 0, spring(t - 1.05 - 0.004, springs.expressive))) / 0.008
  const stretch = 1 + Math.min(0.12, Math.abs(vel) / 9000)
  const pressed = press(t, 1.4, 0.04)
  const echo = ease.out(progress(t, 1.4, 0.55))

  const zoom = lerp(lerp(4.0, 4.15, ease.out(progress(t, 1.05, 0.9))), 3.1, ease.out(progress(t, 1.7, 0.75))) * (1 + 0.07 * ease.inOut(progress(t, 2.1, 0.6)))

  // slots: each item's centre relative to its row centre, measured once from layout
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])
  const rowRef = useRef<HTMLDivElement>(null)
  const [slots, setSlots] = useState<number[]>(() => VARIANTS.map(() => 0))
  const family = t >= 1.0
  useLayoutEffect(() => {
    const row = rowRef.current
    if (!row) return
    setSlots(itemRefs.current.map(el => (el ? el.offsetLeft + el.offsetWidth / 2 - row.offsetWidth / 2 : 0)))
  }, [family])

  // ---- the whip ----
  const pan = whipProgress(film)
  const blur = whipBlur(film)
  const x = -WHIP.dist * pan

  return (
    <Scene theme="light">
      <DirectionalBlur x={blur} className="absolute inset-0" style={{ transform: `translateX(${x}px)` }}>
        {/* the command line */}
        {out < 1 && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ transform: `scale(${push})` }}>
            <DirectionalBlur y={out * 16}>
              <div
                className="whitespace-pre text-left font-medium text-muted-foreground"
                style={{
                  fontFamily: mono,
                  fontSize: SIZE,
                  lineHeight: 1.2,
                  letterSpacing: "-0.02em",
                  width: `${CMD.length}ch`,
                  transformOrigin: "50% 0%",
                  transform: `translateY(${-90 * out}px) scale(${1 + 0.05 * out}, ${1 - 0.97 * out})`,
                  opacity: 1 - out ** 3,
                }}
              >
                {CMD.slice(0, Math.min(typed, SCOPE))}
                <span className="text-accent">{typed > SCOPE ? CMD.slice(SCOPE, typed) : ""}</span>
                <span className="inline-block bg-foreground align-text-bottom" style={{ width: 7, height: SIZE * 0.98, marginLeft: 4, marginRight: -11, opacity: caret ? 1 : 0 }} />
              </div>
            </DirectionalBlur>
          </div>
        )}

        {/* the family: world units are natural px, the camera is `zoom` */}
        {family && (
          <div className="absolute left-1/2 top-1/2" style={{ transform: `scale(${zoom})` }}>
            <div ref={rowRef} className="absolute flex gap-3" style={{ left: 0, top: ROW1, transform: "translate(-50%, -50%)" }}>
              {VARIANTS.map((v, i) => {
                const f = spring(t - (1.7 + i * 0.06), springs.slow)
                const first = i === 0
                const wave = press(t, 2.3 + i * 0.07, 0.05)
                const shown = first || f > 0.001
                return (
                  <div
                    key={v.variant}
                    ref={el => {
                      itemRefs.current[i] = el
                    }}
                    className="relative"
                    style={{
                      zIndex: first ? 5 : 4 - i,
                      opacity: shown ? 1 : 0,
                      transform: `translate(${-slots[i] * (1 - f)}px, ${-ROW1 * (1 - f)}px) scale(${wave})`,
                    }}
                  >
                    <div style={{ transform: first ? `translateY(${dropY}px) scale(${pressed / Math.sqrt(stretch)}, ${pressed * stretch})` : undefined }}>
                      <Button variant={v.variant}>
                        {first ? (
                          <>
                            Send <span className="figures">$12,480.00</span>
                          </>
                        ) : (
                          v.label
                        )}
                      </Button>
                      {first && echo > 0 && echo < 1 && (
                        <span
                          aria-hidden
                          className="pointer-events-none absolute"
                          style={{ inset: -(1 + 16 * echo), borderRadius: 6 + 14 * echo, border: "1px solid var(--foreground)", opacity: 0.55 * (1 - echo) }}
                        />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="absolute flex items-center gap-3" style={{ left: 0, top: ROW2, transform: "translate(-50%, -50%)" }}>
              {SIZES.map((size, i) => {
                const f = spring(t - (2.05 + i * 0.09), springs.slow)
                return (
                  <div key={size} style={{ opacity: remap(f, 0, 0.35), transform: `translateY(${lerp(26, 0, f)}px) scale(${lerp(0.7, 1, f) * press(t, 2.5 + i * 0.07, 0.05)})` }}>
                    <Button size={size}>
                      Pay <span className="figures">$240</span>
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </DirectionalBlur>
    </Scene>
  )
}
