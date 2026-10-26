"use client"

import { useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import type { Controls } from "./motion"

// The composition S2 shows in every preset: a pricing Card (title, price, primary Button), a stat Card with a figure-fit figure, and a row of Switch, Badge and an
// outline Button. All real components. `wide` is the hero (two columns); `stack` is the same pieces in one column for the split.
// The switch and the primary button are the two things that move, so their own transitions are switched off and the film clock
// writes the values the transitions would have passed through (see controls in motion.ts).

export type Rise = [number, number, number]

const CONTROL_ZOOM = 1.8

/** The Switch with its thumb and track pinned: width, travel and track fill come from the clock, not from CSS transitions. */
function FilmSwitch({ c }: { c: Controls }) {
  return (
    <Switch
      checked
      tabIndex={-1}
      aria-label="Autopay"
      className="transition-none [&>span]:transition-none [&>span]:[--thumb:var(--film-w)]! [&>span]:[--tw-translate-x:var(--film-x)]!"
      style={
        {
          "--film-w": `${c.thumbW}px`,
          "--film-x": `${c.thumbX}px`,
          backgroundColor: `color-mix(in oklch, var(--primary) ${c.trackOn * 100}%, var(--input))`,
        } as CSSProperties
      }
    />
  )
}

/** The primary Button with the press pinned: the fill one edge inside plus a same-colour spread, collapsing on press (button.tsx). */
function FilmPrimary({ c, children }: { c: Controls; children: string }) {
  const hover = Math.min(1, c.btn)
  const press = Math.max(0, c.btn - 1)
  const bg = `color-mix(in oklch, var(--primary-active) ${press * 100}%, color-mix(in oklch, var(--primary-hover) ${hover * 100}%, var(--primary)))`
  return (
    <Button
      tabIndex={-1}
      className="w-full [&>span:first-child]:transition-none [&>span:first-child]:[--btn-bg:var(--film-bg)]! [&>span:first-child]:shadow-[0_0_0_var(--film-edge)_var(--film-bg)]!"
      style={{ "--film-bg": bg, "--film-edge": `${1 - press}px` } as CSSProperties}
    >
      {children}
    </Button>
  )
}

const rise = (r: number, travel: number): CSSProperties => ({
  transform: `translateY(${(1 - r) * travel}px)`,
  opacity: Math.min(1, Math.max(0, r * 2.2)),
})

export type Targets = { sw: { x: number; y: number }; btn: { x: number; y: number }; w: number; h: number }

/** Where the switch and the primary button sit in this composition's own pixels, for the pointer. Layout offsets ignore the camera's transforms. */
export function useTargets(root: RefObject<HTMLElement | null>, sw: RefObject<HTMLElement | null>, btn: RefObject<HTMLElement | null>): Targets | null {
  const [targets, setTargets] = useState<Targets | null>(null)
  useLayoutEffect(() => {
    // The cursor's tip is the hot spot and its body trails below it, so the tip aims low to leave the control readable.
    const from = (el: HTMLElement | null, ax: number, dy: number) => {
      let x = 0
      let y = 0
      for (let n = el; n && n !== root.current; n = n.offsetParent as HTMLElement | null) {
        x += n.offsetLeft
        y += n.offsetTop
      }
      return { x: x + (el?.offsetWidth ?? 0) * ax, y: y + (el?.offsetHeight ?? 0) / 2 + dy }
    }
    if (!root.current) return
    setTargets({ sw: from(sw.current, 0.5, 7), btn: from(btn.current, 0.72, 6), w: root.current.offsetWidth, h: root.current.offsetHeight })
  }, [root, sw, btn])
  return targets
}

export function Composition({
  layout,
  c,
  r = [1, 1, 1],
  travel = 90,
  rootRef,
  swRef,
  btnRef,
}: {
  layout: "wide" | "stack"
  c: Controls
  r?: Rise
  travel?: number
  rootRef?: RefObject<HTMLDivElement | null>
  swRef?: RefObject<HTMLDivElement | null>
  btnRef?: RefObject<HTMLDivElement | null>
}) {
  const wide = layout === "wide"
  const pricing = (
    <Card style={rise(r[0], travel)} className={cn(wide && "content-between")}>
      <CardHeader>
        <CardTitle className="text-lg">Team</CardTitle>
      </CardHeader>
      <div className="flex items-baseline gap-2">
        <span className="figures text-5xl font-strong">$24</span>
        <span className="text-muted-foreground">per month</span>
      </div>
      <div ref={btnRef}>
        <FilmPrimary c={c}>Upgrade</FilmPrimary>
      </div>
    </Card>
  )
  const stat = (
    <Card style={rise(r[1], travel)} className="content-between gap-1">
      <span className="text-muted-foreground">Balance</span>
      <div className="@container flex text-4xl font-title">
        <span className="figures figure-fit text-accent">$248,630.42</span>
      </div>
    </Card>
  )
  const row = (
    <div style={rise(r[2], travel)} className="flex items-center justify-between px-1">
      {/* the switch and the badge are the small parts of the row: zoomed so the row's three controls stand about as tall as the button */}
      <div ref={swRef} className="flex">
        <div style={{ zoom: CONTROL_ZOOM }}>
          <FilmSwitch c={c} />
        </div>
      </div>
      <div style={{ zoom: CONTROL_ZOOM }}>
        <Badge variant="success">Settled</Badge>
      </div>
      <Button variant="outline" tabIndex={-1}>
        Export
      </Button>
    </div>
  )
  return (
    <div ref={rootRef} className={cn("relative", wide ? "grid w-[620px] grid-cols-2 items-stretch gap-4" : "grid w-[292px] gap-4")}>
      {wide ? (
        <>
          {pricing}
          <div className="grid grid-rows-[1fr_auto] gap-4">
            {stat}
            {row}
          </div>
        </>
      ) : (
        <>
          {pricing}
          {stat}
          {row}
        </>
      )}
    </div>
  )
}
