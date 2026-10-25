"use client"

import { ease, lerp, progress, spring } from "../clock"
import { fontStack } from "../wordmark"
import { camStyle } from "./cam"

// S4 shot A, 9.0-10.0: the balance in cobalt at 268px. At 9.35 it changes and every changed digit rolls up a line, left to right.
// This is AnimatedNumber's roll (a glyph slides a full line out, the next slides in from the other side, in the direction the value
// moved, unchanged digits stay put) driven by the film clock instead of Motion's WAAPI springs: the renderer cannot pin those
// (Motion starts them at a virtual startTime that is already in the past on the real timeline, so they finish on their first frame).
const FROM = "$248,630.42"
const TO = "$261,110.42"
const ROLL = { visualDuration: 0.3, bounce: 0.22 } // the moderate roll, slowed to read at film scale with a hint of overshoot
const STAGGER = 0.04
const CHANGE = 0.35

export function MacroBalance({ t }: { t: number }) {
  const p = progress(t, 0, 1.0)
  // A small punch of scale as the figure changes, then the push-in carries on.
  const punch = Math.sin(Math.PI * progress(t, CHANGE, 0.5)) * 0.018
  const cam = { s: lerp(0.93, 1.05, ease.out(p)) + punch, ry: lerp(-7, 2.5, ease.out(p)), rx: lerp(2, -0.5, ease.out(p)), p: 2000 }
  const rise = 1 - ease.outExpo(progress(t, 0, 0.45))
  const rule = ease.outExpo(progress(t, 0.05, 0.6))
  return (
    <div className="absolute inset-0">
      <div style={camStyle(cam)}>
        {/* ledger rules: fixed in the camera's plane, drawn left to right */}
        <div className="absolute left-0 right-0 bg-border" style={{ top: 330, height: 2, transformOrigin: "0 50%", transform: `scaleX(${rule})` }} />
        <div className="absolute left-0 right-0 bg-border" style={{ top: 750, height: 2, transformOrigin: "100% 50%", transform: `scaleX(${rule})` }} />
        <div className="absolute inset-x-0 flex flex-col items-center" style={{ top: 330, height: 420, justifyContent: "center" }}>
          <div className="overflow-clip" style={{ padding: "24px 40px" }}>
            <div style={{ transform: `translateY(${rise * 115}%)` }}>
              <span className="figures inline-flex whitespace-pre font-medium text-accent" style={{ fontFamily: fontStack("mono"), fontSize: 268, lineHeight: 1.15, letterSpacing: "-0.05em" }}>
                {[...TO].map((to, i) => {
                  const from = FROM[i]
                  if (from === to) return <span key={i}>{to}</span>
                  const p = spring(t - CHANGE - i * STAGGER, ROLL)
                  const op = progress(t - i * STAGGER, CHANGE, 0.1)
                  return (
                    <span key={i} className="inline-grid overflow-clip">
                      <span className="col-start-1 row-start-1" style={{ transform: `translateY(${-p * 100}%)`, opacity: 1 - op }}>{from}</span>
                      <span className="col-start-1 row-start-1" style={{ transform: `translateY(${(1 - p) * 100}%)`, opacity: op }}>{to}</span>
                    </span>
                  )
                })}
              </span>
            </div>
          </div>
        </div>
        <div
          className="absolute text-muted-foreground"
          style={{ left: 96, top: 262, fontFamily: fontStack("mono"), fontSize: 30, letterSpacing: "-0.01em", opacity: ease.outExpo(progress(t, 0.1, 0.4)) }}
        >
          balance
        </div>
      </div>
    </div>
  )
}
