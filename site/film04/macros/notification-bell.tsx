"use client"

import { Bell } from "lucide-react"
import { Heading } from "@/components/ui/heading"
import { IconButton } from "@/components/ui/icon-button"
import { ease, progress, spring } from "@/site/film/clock"
import { layoutOf } from "./layout"
import { ContentBox, MacroFrame, SPRING, TIER, drift, type Anchors, type ContentOptions, type ContentProps, type MacroContent, type MacroDef, type MacroProps, type PresetId, type Scheme } from "./kit"

// s2 macro 5, 8.0-9.5, Folio light. NotificationBell: the one overshooting swing, the badge pop and a digit roll that does not restart the swing.
//   0.00-0.25  count 0: the bell alone, no badge.
//   0.25       count 1. One swing from the top pivot on the expressive spring (0.63, the 0.42 tier at 1.5x): 12 degrees each way, the
//              spring's overshoot becomes the last small ring. The badge pops from scale 0 on the fast spring (0.16) with a fast fade.
//   0.60       count 2, mid-swing. The badge's digit rolls up a line (moderate: the old 1 leaves on the 0.24 exit tween, the 2 rises on
//              the 0.32 spring). The swing is not restarted, it carries on; nothing else moves. Hold to the cut.
// Options: `second` moves the second count (macro s, default 0.6); `dissolve` (0 to 1) fades the badge's digit into the badge's own colour, for a camera that dives
// into the badge until it fills the frame (film 0.4 shot 10) and must end on a plain field.
// IconButton is the real one; the badge and the bell's span carry NotificationBell's classes with the swing, pop and roll on the clock.
const PRESET: PresetId = "folio"
const SCHEME: Scheme = "light"
const K = 8
const FIRST = 0.25
const SECOND = 0.6
const SWING_DEGREES = 12

export const size = { w: 145, h: 72 }

/** The bell's angle in degrees at t: one swing from the first count, the spring's overshoot its last small ring. */
export const swingAt = (t: number) => SWING_DEGREES * Math.sin(spring(t - FIRST, SPRING.expressive) * 2 * Math.PI)

export function Content({ t, options }: ContentProps) {
  const second = Number(options?.second ?? SECOND)
  const dissolve = Number(options?.dissolve ?? 0)
  const swing = swingAt(t)

  const pop = t - FIRST
  const popScale = spring(pop, SPRING.fast)
  const popOpacity = ease.enter(progress(pop, 0, TIER.fast.enter))

  const s = t - second
  const out = ease.exit(progress(s, 0, TIER.moderate.exit))
  const inY = (1 - spring(s, SPRING.moderate)) * 100
  const inOpacity = ease.enter(progress(s, 0, TIER.moderate.enter))

  return (
    <ContentBox w={size.w} h={size.h}>
        <div className="flex h-full items-center justify-between rounded-container border-line border-border bg-surface px-4">
          <Heading level={2} size="md">
            Inbox
          </Heading>
          <IconButton label="Notifications" variant="outline">
            <span className="inline-flex origin-[50%_8%]" style={{ transform: `rotate(${swing}deg)` }}>
              <Bell />
            </span>
            {t >= FIRST && (
              <span
                aria-hidden
                className="figures absolute -top-2 left-1/2 inline-flex h-4 min-w-4 items-center justify-center rounded-pill bg-primary px-1 text-2xs font-strong text-primary-foreground"
                style={{ opacity: popOpacity, transform: `scale(${popScale})`, color: dissolve > 0 ? `color-mix(in oklab, var(--primary-foreground), var(--primary) ${dissolve * 100}%)` : undefined }}
              >
                <span className="relative inline-flex whitespace-pre">
                  <span className="inline-flex">
                    <span className="inline-grid overflow-clip">
                      {s < TIER.moderate.exit && (
                        <span className="col-start-1 row-start-1" style={{ transform: `translateY(${-out * 100}%)`, opacity: 1 - out }}>
                          1
                        </span>
                      )}
                      {s >= 0 && (
                        <span className="col-start-1 row-start-1" style={{ transform: `translateY(${inY}%)`, opacity: inOpacity }}>
                          2
                        </span>
                      )}
                    </span>
                  </span>
                </span>
              </span>
            )}
          </IconButton>
        </div>
    </ContentBox>
  )
}

/** Anchors in component px, all fixed: the bell swings about `pivot` (its top, where the origin is) but its box does not move; the badge sits at its corner from the first count. */
export function anchors(t: number, preset: PresetId = PRESET, options?: ContentOptions): Anchors {
  void t
  void options
  const { card, heading, button, bell, badge } = layoutOf("notification-bell", preset).rects
  return { card, heading, button, bell, badge, pivot: { x: bell.x, y: bell.y - bell.h / 2 + bell.h * 0.08 } }
}

/** Macro seconds of the beats. */
export const EVENTS = { first: FIRST, second: SECOND }

const content: MacroContent = { size, Content, anchors, events: EVENTS }

function NotificationBellMacro({ t, preset = PRESET, scheme = SCHEME }: MacroProps) {
  return <MacroFrame content={content} preset={preset} scheme={scheme} t={t} zoom={K} cam={drift(t, { x: 30 }, { x: -10 })} caption="NotificationBell" />
}

export const macro: MacroDef = { slug: "notification-bell", name: "NotificationBell", preset: PRESET, scheme: SCHEME, Component: NotificationBellMacro, content }
