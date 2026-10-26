import { readFileSync } from "node:fs"
import { expect, test, type Page } from "@playwright/test"

// Per-frame motion proof shared by tests/motion.spec.ts and the tests/anim-*.spec.ts group specs.
// CSS cases run on Chrome's animation clock slowed 4x (as in scripts/motion-tour.mts), so a 60ms exit
// still spans several frames on a busy machine; the token bound scales with it.

/** A duration token from the generated styles/tokens.json, in ms. */
const tokens = JSON.parse(readFileSync(new URL("../../styles/tokens.json", import.meta.url), "utf8")).scalars as Record<string, string>
export const ms = (name: string) => parseInt(tokens[name], 10)

export async function open(page: Page, path: string) {
  await page.goto(path)
  await page.locator("html[data-hydrated]").waitFor({ state: "attached" })
}

export type Frames = { t: number; v: string }[]

/** Samples computed `props` of the element returned by `target` (a JS expression) on every frame while `act` runs. */
export async function record(page: Page, target: string, props: string[], act: () => Promise<void>, ms: number) {
  const sampling = page.evaluate(
    ({ target, props, ms }) =>
      new Promise<Frames>(resolve => {
        const find = new Function(`return ${target}`) as () => Element | null | undefined
        const frames: Frames = []
        const t0 = performance.now()
        const tick = () => {
          const el = find()
          if (el) {
            const cs = getComputedStyle(el)
            frames.push({ t: performance.now() - t0, v: props.map(p => cs.getPropertyValue(p)).join(" | ") })
          }
          if (performance.now() - t0 < ms) requestAnimationFrame(tick)
          else resolve(frames)
        }
        requestAnimationFrame(tick)
      }),
    { target, props, ms },
  )
  await page.waitForTimeout(40)
  await act()
  const frames = await sampling
  // Collapse runs of identical values: what is left is the visible sequence of states.
  const states = frames.filter((f, i) => i === 0 || f.v !== frames[i - 1].v)
  const span = states.length > 1 ? states[states.length - 1].t - states[1].t : 0
  return { states: states.length, span: Math.round(span), first: states[0]?.v, last: states[states.length - 1]?.v }
}

export type Case = {
  name: string
  path: string
  target: string
  props: string[]
  /** Token duration in ms the motion should settle within (plus frame tolerance). */
  token: number
  /** Properties that carry movement; under reduced motion they must not tween. */
  movement: boolean
  act: (page: Page) => Promise<void>
  setup?: (page: Page) => Promise<void>
  window?: number
  /** Animated or timed by JS (Motion springs, an interval), which Chrome's animation clock cannot slow. */
  js?: boolean
}

/** Vertical offset of a computed matrix(...) transform, 0 for none. */
export const translateY = (transform: string) => (transform.startsWith("matrix(") ? parseFloat(transform.slice(7, -1).split(",")[5]) : 0)

/**
 * Registers a full-motion and a reduced-motion test per case: the full run needs at least three intermediate
 * frames and must settle within the token; under reduced motion a `movement` case may not tween.
 */
export function motionCases(cases: Case[]) {
  for (const reduced of [false, true]) {
    test.describe(reduced ? "reduced motion" : "full motion", () => {
      test.use({ reducedMotion: reduced ? "reduce" : "no-preference", viewport: { width: 1440, height: 900 } })
      for (const c of cases) {
        if (reduced && !c.movement) continue
        test(c.name, async ({ page }) => {
          await open(page, c.path)
          await c.setup?.(page)
          const rate = reduced || c.js ? 1 : 0.25
          if (rate !== 1) {
            const cdp = await page.context().newCDPSession(page)
            await cdp.send("Animation.enable")
            await cdp.send("Animation.setPlaybackRate", { playbackRate: rate })
          }
          const token = c.token / rate
          // Under reduced motion only movement is recorded: opacity fades are the allowed static equivalent.
          const props = reduced ? c.props.filter(p => p !== "opacity") : c.props
          const r = await record(page, c.target, props, () => c.act(page), c.window ? c.window / rate : Math.max(700, token + 600))
          console.log(`${reduced ? "[reduced] " : ""}${c.name}: ${r.states} states over ${r.span}ms (token ${token}ms)  ${r.first} → ${r.last}`)
          if (!reduced) {
            expect(r.states, "animation should pass through intermediate frames").toBeGreaterThanOrEqual(3)
            if (c.token < 1000) expect(r.span, "animation should settle within its token").toBeLessThanOrEqual(token + 120)
          } else {
            expect(r.states, "movement should jump, not tween, under reduced motion").toBeLessThanOrEqual(2)
          }
        })
      }
    })
  }
}
