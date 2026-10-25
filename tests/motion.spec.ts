import { readFileSync } from "node:fs"
import { expect, test, type Page } from "@playwright/test"

// Frame-by-frame proof that each animation actually runs on its motion token, and that
// movement (translate/scale/transform) becomes a jump under prefers-reduced-motion.
// CSS cases run on Chrome's animation clock slowed 4x (as in scripts/motion-tour.mts), so a 60ms exit
// still spans several frames on a busy machine; the token bound scales with it.

/** A duration token from the generated styles/tokens.json, in ms. */
const tokens = JSON.parse(readFileSync(new URL("../styles/tokens.json", import.meta.url), "utf8")).scalars as Record<string, string>
const ms = (name: string) => parseInt(tokens[name], 10)

async function open(page: Page, path: string) {
  await page.goto(path)
  await page.locator("html[data-hydrated]").waitFor({ state: "attached" })
}

type Frames = { t: number; v: string }[]

/** Samples computed `props` of the element returned by `target` (a JS expression) on every frame while `act` runs. */
async function record(page: Page, target: string, props: string[], act: () => Promise<void>, ms: number) {
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

type Case = {
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

const popup = `document.querySelector('[class*="origin-(--transform-origin)"]')`

const cases: Case[] = [
  {
    name: "button press (Fluid: fill tightens 1px)",
    path: "/components/button/",
    target: `document.querySelector('main section button span[aria-hidden]')`,
    props: ["box-shadow"],
    token: 80,
    movement: false,
    setup: async p => {
      const box = (await p.locator("main section button").first().boundingBox())!
      await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
      await p.waitForTimeout(400) // let the hover tint settle so only the press is measured
    },
    act: p => p.mouse.down(),
  },
  {
    name: "checkbox check draws in",
    path: "/components/checkbox/",
    target: `document.querySelector('main [role=checkbox] path')`,
    props: ["stroke-dashoffset"],
    token: 80,
    movement: true,
    act: p => p.locator("main [role=checkbox]").first().click(),
  },
  {
    name: "radio dot pops in",
    path: "/components/radio/",
    target: `document.querySelector('main [role=radio] span')`,
    props: ["scale"],
    token: 80,
    movement: true,
    act: p => p.locator("main [role=radio]").first().click(),
  },
  {
    name: "switch thumb travels",
    path: "/components/switch/",
    target: `document.querySelectorAll('main [role=switch]')[1]?.firstElementChild`,
    props: ["translate"],
    token: 160,
    movement: true,
    act: p => p.locator("main [role=switch]").nth(1).click(),
  },
  {
    name: "select popup opens (moderate tier)",
    path: "/components/select/",
    target: popup,
    props: ["opacity", "scale"],
    token: ms("duration-moderate"),
    movement: true,
    act: p => p.getByRole("combobox", { name: "Network" }).first().click(),
  },
  {
    name: "select highlight glides between options",
    js: true,
    path: "/components/select/",
    target: `document.querySelector('[role=listbox] > span[aria-hidden]')`,
    props: ["transform"],
    token: 80,
    movement: true,
    setup: async p => {
      await p.getByRole("combobox", { name: "Network" }).first().click()
      await p.waitForTimeout(300)
      await p.getByRole("option").first().hover()
      await p.waitForTimeout(300)
    },
    act: p => p.getByRole("option").nth(3).hover(),
  },
  {
    name: "menu popup opens (moderate tier)",
    path: "/components/dropdown-menu/",
    target: popup,
    props: ["opacity", "scale"],
    token: ms("duration-moderate"),
    movement: true,
    act: p => p.getByRole("button", { name: "Invoice actions" }).click(),
  },
  {
    // An outside press, not Escape: Base UI marks an Escape close data-instant="dismiss", which skips the fade by design.
    name: "menu popup closes (fast exit)",
    path: "/components/dropdown-menu/",
    target: popup,
    props: ["opacity", "scale"],
    token: ms("duration-fast-exit"),
    movement: true,
    setup: async p => {
      await p.getByRole("button", { name: "Invoice actions" }).click()
      await p.waitForTimeout(500)
    },
    act: p => p.mouse.click(8, 8),
  },
  {
    name: "combobox highlight glides between options",
    js: true,
    path: "/components/combobox/",
    target: `document.querySelector('[class*="origin-(--transform-origin)"] > span[aria-hidden]')`,
    props: ["transform"],
    token: 80,
    movement: true,
    setup: async p => {
      await p.getByRole("combobox").first().click()
      await p.keyboard.type("a")
      await p.waitForTimeout(300)
      await p.keyboard.press("ArrowDown")
      await p.waitForTimeout(300)
    },
    act: p => p.keyboard.press("ArrowDown"),
  },
  {
    name: "button icon stroke tightens on hover",
    path: "/components/button/",
    target: `document.querySelector('main section button:has(svg:not([data-spinner])) svg')`,
    props: ["stroke-width"],
    token: 80,
    movement: false,
    act: p => p.locator("main section button", { has: p.locator("svg") }).first().hover(),
  },
  {
    name: "dialog opens (slow tier spring)",
    path: "/components/dialog/",
    target: `document.querySelector('[role=dialog]')`,
    props: ["opacity", "scale"],
    token: 240,
    movement: true,
    act: p => p.getByRole("button", { name: "Rename wallet" }).click(),
  },
  {
    name: "dialog closes",
    path: "/components/dialog/",
    target: `document.querySelector('[role=dialog]')`,
    props: ["opacity", "scale"],
    token: 160,
    movement: true,
    setup: async p => {
      await p.getByRole("button", { name: "Rename wallet" }).click()
      await p.waitForTimeout(500)
    },
    act: p => p.keyboard.press("Escape"),
  },
  {
    name: "drawer slides in (moderate tier)",
    path: "/components/drawer/",
    target: `document.querySelector('[role=dialog]')`,
    props: ["transform"],
    token: ms("duration-moderate"),
    movement: true,
    act: p => p.getByRole("button", { name: "Filters" }).click(),
  },
  {
    name: "command palette opens",
    path: "/components/command-palette/",
    target: `document.querySelector('[role=dialog][aria-label="Command palette"]')`,
    props: ["opacity", "scale"],
    token: 240,
    movement: true,
    act: p => p.keyboard.press("ControlOrMeta+k"),
  },
  {
    name: "toast rises in (expressive tier spring)",
    path: "/components/toast/",
    target: `document.querySelector('[role=dialog][data-type]')`,
    props: ["opacity", "translate"],
    token: ms("duration-expressive"),
    movement: true,
    act: p => p.getByRole("button", { name: "Success" }).click(),
  },
  {
    name: "tooltip opens (fast tier, fade and slide)",
    path: "/components/tooltip/",
    target: `document.querySelector('[class*="z-(--z-tooltip)"] > *')`,
    props: ["opacity", "translate"],
    token: 80,
    movement: true,
    act: p => p.getByRole("button", { name: "Bold" }).hover(),
    window: 1000,
  },
  {
    name: "progress fill eases to new value",
    js: true,
    path: "/components/progress/",
    target: `document.querySelectorAll('main [role=progressbar]')[3]?.children[1]?.firstElementChild`,
    props: ["width"],
    token: 240,
    movement: false,
    act: async () => {},
    window: 1500,
  },
  {
    name: "docs nav highlight glides",
    js: true,
    path: "/components/button/",
    target: `document.querySelector('aside nav span[aria-hidden]')`,
    props: ["transform"],
    token: 80,
    movement: true,
    setup: async p => {
      await p.locator("aside nav").getByRole("link", { name: "Text", exact: true }).hover()
      await p.waitForTimeout(300)
    },
    act: p => p.locator("aside nav").getByRole("link", { name: "Select", exact: true }).hover(),
  },
  {
    name: "tabs indicator glides (moderate tier spring)",
    path: "/components/tabs/",
    target: `document.querySelector('main [role=tablist] > span[role=presentation]')`,
    props: ["translate", "width", "opacity"],
    token: ms("duration-moderate"),
    movement: true,
    act: p => p.getByRole("tablist").first().getByRole("tab", { name: "Transfers" }).click(),
  },
  {
    name: "accordion panel opens (fast tier height)",
    path: "/components/accordion/",
    target: `document.querySelectorAll('main section')[0]?.querySelector('[role=region]')`,
    props: ["height", "opacity"],
    token: ms("duration-fast"),
    movement: true,
    act: p => p.getByRole("button", { name: "How long do transfers take?" }).first().click(),
  },
  {
    name: "accordion panel closes (fast exit)",
    path: "/components/accordion/",
    target: `document.querySelectorAll('main section')[0]?.querySelector('[role=region]')`,
    props: ["height", "opacity"],
    token: ms("duration-fast-exit"),
    movement: true,
    setup: async p => {
      await p.getByRole("button", { name: "How long do transfers take?" }).first().click()
      await p.waitForTimeout(500)
    },
    act: p => p.getByRole("button", { name: "How long do transfers take?" }).first().click(),
  },
  {
    name: "pagination indicator slides (moderate tier spring)",
    js: true,
    path: "/components/pagination/",
    target: `document.querySelector('main nav[aria-label=Pagination] span.bg-primary')`,
    props: ["transform"],
    token: ms("duration-moderate"),
    movement: true,
    act: p => p.getByRole("navigation", { name: "Pagination" }).first().getByRole("button", { name: "Page 4" }).click(),
  },
  {
    name: "skeleton pulses",
    path: "/components/skeleton/",
    target: `document.querySelector('main [aria-busy] [aria-hidden]')`,
    props: ["opacity"],
    token: 2000,
    movement: false,
    act: async () => {},
    window: 1200,
  },
]

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
