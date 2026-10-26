import { expect, test, type Page } from "@playwright/test"
import { motionCases, ms, open, record, type Case } from "./helpers/motion"

// Feedback group of fine 0.4's everyday animations: CopyButton, AsyncStatus, AutoHeight. Per-frame motion proofs go
// through motionCases() from ./helpers/motion (computed styles on every frame, a jump under reduced motion); the
// keyboard and a11y cases are plain tests. Chrome's clipboard is granted so a real copy succeeds.

const slugs = ["copy-button", "async-status", "auto-height"]

// Frame sampling is the one timing-sensitive part: on a machine busy with builds a 160ms spring can land on two frames.
// A broken animation fails every attempt, so a retry only absorbs a starved frame loop.
test.describe.configure({ retries: 2 })

test.use({ viewport: { width: 1440, height: 900 }, permissions: ["clipboard-read", "clipboard-write"] })

test("feedback pages hydrate and log no page errors", async ({ page }) => {
  const errors: string[] = []
  page.on("pageerror", e => errors.push(e.message))
  for (const slug of slugs) {
    await open(page, `/components/${slug}/`)
    await expect(page.locator("main h1")).toBeVisible()
  }
  expect(errors).toEqual([])
})

/** The docs section of one example, as a JS expression and as a locator. */
const section = (id: string) => `document.getElementById('example-${id}').closest('section')`
/** page.evaluate of a JS expression, typed. */
const ev = <T>(page: Page, expr: string) => page.evaluate(expr) as Promise<T>
const within = (page: Page, id: string) => page.locator(`section:has(#example-${id})`)

// CopyButton: the first button of the ApiKey example. Its icon layers are the children of the 16px grid, in the order
// copy, check, X.
const copyButton = `${section("ApiKey")}.querySelector('button')`
const copyLayer = (n: number) => `${copyButton}.querySelectorAll('span.grid.size-4 > span')[${n}]`

// AsyncStatus: the States example. Layers are spinner, check, X; labels are the rolling [data-label] spans.
const status = `${section("States")}.querySelector('[role=status]')`
const statusLayer = (n: number) => `${status}.querySelector('span.grid.size-4').children[${n}]`
const label = (text: string) => `[...${status}.querySelectorAll('[data-label]')].find(l => l.textContent === '${text}')`
const setState = (page: Page, state: string) => within(page, "States").getByRole("button", { name: state, exact: true }).click()

// AutoHeight: the container is the element of the example that clips; the panes are its inner wrapper's children.
const box = (id: string) => `${section(id)}.querySelector('[class*="overflow-hidden"]')`
const panes = (id: string) => `${box(id)}.firstElementChild`
/** The pane whose content mentions `text`: the old view and the new one coexist while they cross. */
const pane = (id: string, text: string) => `[...${panes(id)}.children].find(p => p.textContent.includes('${text}'))`

const cases: Case[] = [
  {
    name: "copy icon leaves and the check enters (fast tier)",
    path: "/components/copy-button/",
    target: copyLayer(1),
    props: ["opacity", "scale"],
    token: ms("duration-fast"),
    movement: true,
    act: p => within(p, "ApiKey").getByRole("button", { name: "Copy API key" }).click(),
  },
  {
    name: "copy icon fades out as it leaves (fast exit)",
    path: "/components/copy-button/",
    target: copyLayer(0),
    props: ["opacity", "scale"],
    token: ms("duration-fast-exit"),
    movement: true,
    act: p => within(p, "ApiKey").getByRole("button", { name: "Copy API key" }).click(),
  },
  {
    name: "copy check draws its stroke (moderate tier)",
    path: "/components/copy-button/",
    target: `${copyLayer(1)}.querySelector('path')`,
    props: ["stroke-dashoffset"],
    token: ms("duration-moderate"),
    movement: true,
    act: p => within(p, "ApiKey").getByRole("button", { name: "Copy API key" }).click(),
  },
  {
    name: "async status label rolls up to the new text (moderate tier spring)",
    js: true,
    path: "/components/async-status/",
    target: label("Saved"),
    props: ["opacity", "transform"],
    token: ms("duration-moderate"),
    movement: true,
    act: p => setState(p, "success"),
  },
  {
    name: "async status old label rolls out on the moderate exit",
    js: true,
    path: "/components/async-status/",
    target: label("Saving"),
    props: ["opacity", "transform"],
    token: ms("duration-moderate-exit"),
    movement: true,
    setup: async p => {
      await setState(p, "pending")
      await p.waitForTimeout(500)
    },
    act: p => setState(p, "error"),
  },
  {
    name: "async status check draws (moderate tier)",
    path: "/components/async-status/",
    target: `${statusLayer(1)}.querySelector('path')`,
    props: ["stroke-dashoffset"],
    token: ms("duration-moderate"),
    movement: true,
    act: p => setState(p, "success"),
  },
  {
    name: "async status spinner gives way (moderate tier fade)",
    path: "/components/async-status/",
    target: statusLayer(0),
    props: ["opacity"],
    token: ms("duration-moderate-exit"),
    movement: false,
    setup: async p => {
      await setState(p, "pending")
      await p.waitForTimeout(500)
    },
    act: p => setState(p, "error"),
  },
  {
    name: "auto height glides when the content grows (moderate tier)",
    path: "/components/auto-height/",
    target: box("Expand"),
    props: ["height"],
    token: ms("duration-moderate"),
    movement: true,
    act: p => within(p, "Expand").getByRole("switch").click(),
  },
  {
    name: "auto height glides when the content shrinks (moderate tier)",
    path: "/components/auto-height/",
    target: box("Expand"),
    props: ["height"],
    token: ms("duration-moderate"),
    movement: true,
    setup: async p => {
      await within(p, "Expand").getByRole("switch").click()
      await p.waitForTimeout(600)
    },
    act: p => within(p, "Expand").getByRole("switch").click(),
  },
  {
    name: "auto height: the new view fades in on the moderate tier",
    js: true, // Motion's own clock: it stalls under Chrome's slowed animation rate
    path: "/components/auto-height/",
    target: pane("Steps", "Growth"),
    props: ["opacity"],
    token: ms("duration-moderate"),
    movement: false,
    act: p => within(p, "Steps").getByRole("button", { name: "Continue" }).click(),
  },
]

motionCases(cases)

test.describe("copy button", () => {
  test.use({ reducedMotion: "no-preference" })

  test("copies the text and the check reverts to the copy icon after the timeout, on the fast exit", async ({ page }) => {
    await open(page, "/components/copy-button/")
    const cdp = await page.context().newCDPSession(page)
    await cdp.send("Animation.enable")
    await cdp.send("Animation.setPlaybackRate", { playbackRate: 0.25 })
    const button = within(page, "ApiKey").getByRole("button", { name: "Copy API key" })
    // The timer is real time, only the transition is slowed: sample past the 1500ms timeout.
    const r = await record(page, copyLayer(1), ["opacity"], () => button.click(), 2400)
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("sk_live_4eC39HqLyjWDarjt")
    // In (80ms), hold, out: the last state is the retreated one, and the way out passes through frames.
    expect(r.last).toBe("0")
    expect(r.states, "fade in, then fade out").toBeGreaterThanOrEqual(6)
    await expect(within(page, "ApiKey").getByRole("button", { name: "Copy API key" })).toBeVisible()
  })

  test("the accessible name and the icon change in the same commit, and a polite live region says so", async ({ page }) => {
    await open(page, "/components/copy-button/")
    const region = within(page, "ApiKey").getByRole("status")
    await expect(region, "the live region exists before anything changes").toHaveText("")
    await page.evaluate(`(() => {
      const btn = ${copyButton}
      window.__seen = []
      new MutationObserver(() => {
        const layers = btn.querySelectorAll('span.grid.size-4 > span')
        window.__seen.push([btn.getAttribute('aria-label'), layers[0].hasAttribute('data-on'), layers[1].hasAttribute('data-on')].join())
      }).observe(btn, { attributes: true, subtree: true, attributeFilter: ['aria-label', 'data-on'] })
    })()`)
    await within(page, "ApiKey").getByRole("button", { name: "Copy API key" }).click()
    await expect(within(page, "ApiKey").getByRole("button", { name: "Copied" })).toBeVisible()
    await expect(region).toHaveText("Copied")
    expect(await region.getAttribute("role")).toBe("status")
    const seen = await page.evaluate(() => (window as unknown as { __seen: string[] }).__seen)
    expect(seen.length).toBeGreaterThan(0)
    for (const s of seen) expect(["Copy API key,true,false", "Copied,false,true"], `half-changed state: ${s}`).toContain(s)
    // And back, again together, with the live region cleared.
    await expect(within(page, "ApiKey").getByRole("button", { name: "Copy API key" })).toBeVisible({ timeout: 3000 })
    await expect(region).toHaveText("")
  })

  test("Enter and Space copy and focus stays on the button", async ({ page }) => {
    await open(page, "/components/copy-button/")
    const button = within(page, "ApiKey").getByRole("button", { name: "Copy API key" })
    await button.focus()
    await page.keyboard.press("Enter")
    await expect(within(page, "ApiKey").getByRole("button", { name: "Copied" })).toBeFocused()
    await expect(within(page, "ApiKey").getByRole("button", { name: "Copy API key" })).toBeFocused({ timeout: 3000 })
    await page.keyboard.press("Space")
    await expect(within(page, "ApiKey").getByRole("button", { name: "Copied" })).toBeFocused()
  })

  test("copying again restarts the timeout", async ({ page }) => {
    await open(page, "/components/copy-button/")
    const button = () => within(page, "ApiKey").locator("button").first() // the name changes, so not by role and name
    await button().click()
    await page.waitForTimeout(1000)
    await button().click() // 1000ms in: the first timer would fire at 1500ms
    await page.waitForTimeout(900) // 1900ms from the first click, 900ms from the second
    await expect(button()).toHaveAccessibleName("Copied")
    await expect(button()).toHaveAccessibleName("Copy API key", { timeout: 3000 })
  })

  test("a refused clipboard shows a danger X and reads Copy failed", async ({ page }) => {
    await open(page, "/components/copy-button/")
    await page.evaluate(() => {
      Object.defineProperty(navigator.clipboard, "writeText", { value: () => Promise.reject(new DOMException("denied", "NotAllowedError")), configurable: true })
    })
    await within(page, "ApiKey").getByRole("button", { name: "Copy API key" }).click()
    await expect(within(page, "ApiKey").getByRole("button", { name: "Copy failed" })).toBeVisible()
    await expect(within(page, "ApiKey").getByRole("status")).toHaveText("Copy failed")
    const colors = await ev<Record<string, string | boolean>>(page, `(() => {
      const probe = document.createElement('span')
      probe.style.color = 'var(--danger-subtle-foreground)'
      document.body.append(probe)
      const danger = getComputedStyle(probe).color
      probe.remove()
      return { x: getComputedStyle(${copyLayer(2)}).color, danger, shown: ${copyLayer(2)}.hasAttribute('data-on'), check: ${copyLayer(1)}.hasAttribute('data-on') }
    })()`)
    expect(colors).toMatchObject({ shown: true, check: false })
    expect(colors.x).toBe(colors.danger)
  })
})

test.describe("async status", () => {
  test.use({ reducedMotion: "no-preference" })

  test("is a polite status region and the new label is in the DOM on the frame of the state change", async ({ page }) => {
    await open(page, "/components/async-status/")
    const region = within(page, "States").getByRole("status")
    await expect(region).toHaveAttribute("aria-live", "polite")
    await expect(region.locator(".sr-only")).toHaveText("")
    // React commits a click's update in a microtask, before the browser can paint: reading after one is the same frame.
    const read = (name: string) =>
      page.evaluate(`(async () => {
        const button = [...${section("States")}.querySelectorAll('button')].find(b => b.textContent === '${name}')
        button.click()
        await Promise.resolve()
        return ${status}.querySelector('.sr-only').textContent
      })()`)
    expect(await read("pending")).toBe("Saving")
    expect(await read("success")).toBe("Saved")
    expect(await read("error")).toBe("Failed")
    expect(await read("idle")).toBe("")
  })

  test("the rolling copy is hidden from assistive tech", async ({ page }) => {
    await open(page, "/components/async-status/")
    await setState(page, "success")
    await expect(within(page, "States").locator("[data-label]")).toHaveCount(1)
    expect(await page.evaluate(`!!${label("Saved")}.closest('[aria-hidden=true]')`)).toBe(true)
    expect(await page.evaluate(`!!${statusLayer(1)}.closest('[aria-hidden=true]')`)).toBe(true)
  })

  test("pending shows the spinner, success a check, error a danger X and label", async ({ page }) => {
    await open(page, "/components/async-status/")
    const on = (n: number) => page.evaluate(`${statusLayer(n)}.hasAttribute('data-on')`)
    await setState(page, "pending")
    expect([await on(0), await on(1), await on(2)]).toEqual([true, false, false])
    await setState(page, "success")
    expect([await on(0), await on(1), await on(2)]).toEqual([false, true, false])
    await setState(page, "error")
    expect([await on(0), await on(1), await on(2)]).toEqual([false, false, true])
    await page.waitForTimeout(400)
    const colors = await ev<Record<string, string | boolean>>(page, `(() => {
      const probe = document.createElement('span')
      probe.style.color = 'var(--danger-subtle-foreground)'
      document.body.append(probe)
      const danger = getComputedStyle(probe).color
      probe.remove()
      return { x: getComputedStyle(${statusLayer(2)}).color, label: getComputedStyle(${label("Failed")}).color, danger }
    })()`)
    expect(colors.x).toBe(colors.danger)
    expect(colors.label).toBe(colors.danger)
  })

  test("the spinner stops spinning once it has given way", async ({ page }) => {
    await open(page, "/components/async-status/")
    await setState(page, "pending")
    // The path runs two animations; the browser may fold equal play states into one.
    const states = async () => [...new Set(((await page.evaluate(`getComputedStyle(${statusLayer(0)}.querySelector('path')).animationPlayState`)) as string).split(", "))]
    expect(await states()).toEqual(["running"])
    await setState(page, "error")
    expect(await states()).toEqual(["paused"])
  })

  test("the first render does not animate: the saved label ships fully visible", async ({ request }) => {
    const html = await (await request.get("/components/async-status/")).text()
    const first = html.match(/<span[^>]*data-label[^>]*>Saved<\/span>/)?.[0]
    expect(first, "the Autosave example renders its Saved label on the server").toBeTruthy()
    expect(first).not.toMatch(/opacity:\s*0/)
    expect(first).not.toMatch(/translateY/)
  })

  test("a failed sync can be retried: Sync failed, then Synced", async ({ page }) => {
    await open(page, "/components/async-status/")
    const button = within(page, "Retry").getByRole("button", { name: "Sync ledger" })
    const text = within(page, "Retry").getByRole("status").locator(".sr-only")
    await button.click()
    await expect(text).toHaveText("Syncing")
    await expect(button, "the button is disabled while pending").toBeDisabled()
    await expect(text).toHaveText("Sync failed", { timeout: 3000 })
    await button.click()
    await expect(text).toHaveText("Synced", { timeout: 3000 })
  })
})

test.describe("async status under reduced motion", () => {
  test.use({ reducedMotion: "reduce" })

  test("the label crossfades: the fade stays, there is no travel", async ({ page }) => {
    await open(page, "/components/async-status/")
    const r = await record(page, label("Saved"), ["opacity"], () => setState(page, "success"), 600)
    expect(r.states, "the fade is kept").toBeGreaterThanOrEqual(3)
    const moved = await record(page, label("Failed"), ["transform"], () => setState(page, "error"), 600)
    expect(moved.states, "no travel").toBeLessThanOrEqual(2)
  })
})

test.describe("auto height", () => {
  test.use({ reducedMotion: "no-preference" })

  test("the container follows its content and the first measure does not animate", async ({ page }) => {
    await open(page, "/components/auto-height/")
    expect(await page.evaluate(() => document.getAnimations().filter(a => "transitionProperty" in a && (a as CSSTransition).transitionProperty === "height").length)).toBe(0)
    const heights = () =>
      ev<{ box: number; content: number }>(page, `({ box: ${box("Expand")}.getBoundingClientRect().height, content: ${panes("Expand")}.getBoundingClientRect().height })`)
    const closed = await heights()
    expect(closed.box).toBeCloseTo(closed.content, 0)
    await within(page, "Expand").getByRole("switch").click()
    await page.waitForTimeout(700)
    const open1 = await heights()
    expect(open1.box).toBeGreaterThan(closed.box + 40)
    expect(open1.box).toBeCloseTo(open1.content, 0)
    await within(page, "Expand").getByRole("switch").click()
    await page.waitForTimeout(700)
    expect((await heights()).box).toBeCloseTo(closed.box, 0)
  })

  test("without a transitionKey the content is resized in place, not crossfaded", async ({ page }) => {
    await open(page, "/components/auto-height/")
    await within(page, "Expand").getByRole("switch").click()
    await page.waitForTimeout(50)
    expect(await page.evaluate(`${panes("Expand")}.children.length`), "one pane, no leaving copy").toBe(1)
    expect(await page.evaluate(`${panes("Expand")}.querySelector('[inert]')`)).toBeNull()
  })

  test("the leaving view fades out on the fast exit tween", async ({ page }) => {
    await open(page, "/components/auto-height/")
    // Motion drives this opacity through the Web Animations API, so the tier is readable from the animation itself:
    // a 60ms tween on the exit curve. Frames at 60fps are too few to count on for a duration this short.
    const leaving = await ev<{ duration: number; easing: string }>(page, `(async () => {
      const btn = [...${section("Steps")}.querySelectorAll('button')].find(b => b.textContent === 'Continue')
      btn.click()
      await Promise.resolve()
      const old = ${pane("Steps", "Work email")}
      for (let i = 0; i < 30 && !old.getAnimations().length; i++) await new Promise(r => requestAnimationFrame(r))
      const timing = old.getAnimations()[0].effect.getTiming()
      return { duration: timing.duration, easing: timing.easing }
    })()`)
    expect(leaving.duration).toBe(ms("duration-fast-exit"))
    expect(leaving.easing).toBe("cubic-bezier(0.42, 0, 1, 1)")
    await expect(page.locator("section:has(#example-Steps) [inert]"), "and it is removed once faded").toHaveCount(0)
  })

  test("a changed transitionKey leaves the old view inert and out of flow, and never moves focus", async ({ page }) => {
    await open(page, "/components/auto-height/")
    const next = within(page, "Steps").getByRole("button", { name: "Continue" })
    await next.focus()
    // Watch the DOM from inside the page: the old view is gone again within 60ms.
    await page.evaluate(`(() => {
      window.__leaving = null
      new MutationObserver(() => {
        const old = ${panes("Steps")}.querySelector('[inert]')
        if (old && !window.__leaving) window.__leaving = { position: getComputedStyle(old).position, text: old.textContent, panes: ${panes("Steps")}.children.length }
      }).observe(${box("Steps")}, { childList: true, subtree: true, attributes: true })
    })()`)
    await page.keyboard.press("Enter")
    await expect(within(page, "Steps").locator("p", { hasText: "Unlimited invoices" })).toBeVisible()
    const leaving = await page.evaluate(() => (window as unknown as { __leaving: { position: string; text: string; panes: number } }).__leaving)
    expect(leaving, "the old view was inert while it left").not.toBeNull()
    expect(leaving).toMatchObject({ position: "absolute", panes: 2 })
    expect(leaving.text).toContain("Work email")
    await expect(within(page, "Steps").getByRole("button", { name: "Continue" })).toBeFocused()
    await expect(page.locator("section:has(#example-Steps) [inert]")).toHaveCount(0)
    expect(await page.evaluate(`${panes("Steps")}.children.length`)).toBe(1)
  })

  test("the leaving view's field cannot take focus while it fades", async ({ page }) => {
    await open(page, "/components/auto-height/")
    const takesFocus = await page.evaluate(`(async () => {
      const btn = [...${section("Steps")}.querySelectorAll('button')].find(b => b.textContent === 'Continue')
      btn.click()
      await Promise.resolve() // React commits the update in this microtask; the old view is still fading
      const old = ${panes("Steps")}.querySelector('[inert]')
      if (!old) return 'no leaving view'
      old.querySelector('input').focus()
      return old.contains(document.activeElement)
    })()`)
    expect(takesFocus).toBe(false)
  })
})

test.describe("auto height under reduced motion", () => {
  test.use({ reducedMotion: "reduce" })

  test("the crossfade stays while the height jumps", async ({ page }) => {
    await open(page, "/components/auto-height/")
    const fade = await record(page, `${panes("Steps")}.querySelector(':scope > div:not([inert])')`, ["opacity"], () => within(page, "Steps").getByRole("button", { name: "Continue" }).click(), 600)
    expect(fade.states, "the fade is kept").toBeGreaterThanOrEqual(3)
  })
})
