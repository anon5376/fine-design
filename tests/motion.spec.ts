import { expect, test } from "@playwright/test"
import { motionCases, ms, open, record, translateY, type Case } from "./helpers/motion"

// Frame-by-frame proof that each animation actually runs on its motion token, and that
// movement (translate/scale/transform) becomes a jump under prefers-reduced-motion.
// CSS cases run on Chrome's animation clock slowed 4x (as in scripts/motion-tour.mts), so a 60ms exit
// still spans several frames on a busy machine; the token bound scales with it.

const popup = `document.querySelector('[class*="origin-(--transform-origin)"]')`

/** The Nth AnimatedNumber on the page, and its rolling glyph showing `text` (the one entering when a digit changes). */
const figure = (n: number) => `document.querySelectorAll('main span.figures.relative')[${n}]`
const glyph = (n: number, text: string) =>
  `[...${figure(n)}.querySelectorAll('[aria-hidden] .col-start-1')].filter(g => g.textContent === '${text}').pop()`
/** A tag by its text, exiting or not. */
const tag = (text: string) => `[...document.querySelectorAll('main [data-tag]')].find(t => t.textContent.includes('${text}'))`

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
      await p.locator("#main").getByRole("combobox").first().click() // not the preset switch in the sidebar
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
  {
    name: "animated number rolls a changed digit (moderate tier spring)",
    js: true,
    path: "/components/animated-number/",
    target: glyph(0, "5"),
    props: ["opacity", "transform"],
    token: ms("duration-moderate"),
    movement: true,
    act: p => p.getByRole("button", { name: "Add 125" }).click(),
  },
  {
    name: "animated number grows for an added digit (moderate tier spring)",
    js: true,
    path: "/components/animated-number/",
    target: figure(0),
    props: ["width"],
    token: ms("duration-moderate"),
    movement: true,
    setup: async p => {
      for (let i = 0; i < 3; i++) await p.getByRole("button", { name: "Subtract 125" }).click() // 1,280 to 905
      await p.waitForTimeout(500)
    },
    act: p => p.getByRole("button", { name: "Add 125" }).click(), // 1,030
  },
  {
    name: "pricing price rolls when billing switches",
    js: true,
    path: "/blocks/pricing/",
    target: glyph(1, "9"),
    props: ["opacity", "transform"],
    token: ms("duration-moderate"),
    movement: true,
    act: p => p.getByRole("tab", { name: "Monthly" }).first().click(), // Growth 24 to 29
  },
  {
    name: "tag leaves on the fast exit",
    js: true,
    path: "/components/tag/",
    target: `document.querySelector('main [data-tag][inert]')`,
    props: ["opacity", "transform"],
    token: ms("duration-fast-exit"),
    movement: true,
    act: p => p.getByRole("button", { name: "Remove Over $10k" }).click(),
  },
  {
    name: "tag siblings glide into the freed space (moderate tier spring)",
    js: true,
    path: "/components/tag/",
    target: tag("Last 30 days"),
    props: ["transform"],
    token: ms("duration-moderate"),
    movement: true,
    act: p => p.getByRole("button", { name: "Remove Over $10k" }).click(),
  },
  {
    name: "slider glides to a track press (moderate tier)",
    path: "/components/slider/",
    target: `document.querySelector('main input[type=range]').parentElement`,
    props: ["left"],
    token: ms("duration-moderate"),
    movement: true,
    act: async p => {
      const box = (await p.locator("main .touch-none").first().boundingBox())!
      await p.mouse.click(box.x + box.width * 0.9, box.y + box.height / 2)
    },
  },
]

motionCases(cases)

// Behaviour the per-frame cases above cannot express: direction, what must stay instant, what must not animate, and timing that starts before load.
test.describe("motion behaviour", () => {
  test.use({ reducedMotion: "no-preference", viewport: { width: 1440, height: 900 } })

  test("animated number rolls up when the value rises and down when it falls", async ({ page }) => {
    await open(page, "/components/animated-number/")
    const up = await record(page, glyph(0, "5"), ["transform"], () => page.getByRole("button", { name: "Add 125" }).click(), 600)
    expect(translateY(up.first!), "the new digit enters from below when the value rose").toBeGreaterThan(0)
    await page.waitForTimeout(400)
    const down = await record(page, glyph(0, "8"), ["transform"], () => page.getByRole("button", { name: "Subtract 125" }).click(), 600)
    expect(translateY(down.first!), "the new digit enters from above when the value fell").toBeLessThan(0)
  })

  test("animated number keeps unchanged digits still and the final value readable at once", async ({ page }) => {
    await open(page, "/components/animated-number/")
    // 1,280 to 1,405: the 2, 8 and 0 change; the 1 does not.
    const unchanged = await record(page, `[...${figure(0)}.querySelectorAll('[aria-hidden] .col-start-1')].find(g => g.textContent === '1')`, ["transform", "opacity"], () =>
      page.getByRole("button", { name: "Add 125" }).click(), 600)
    expect(unchanged.states, "a digit that did not change must not animate").toBe(1)
    // The accessible value is final on the frame of the click, not mid-roll.
    await page.getByRole("button", { name: "Add 125" }).click()
    expect(await page.locator("main span.figures.relative").first().locator(".sr-only").textContent()).toBe("1,530") // 1,405 plus another 125
  })

  test("slider drag tracks the pointer without a glide", async ({ page }) => {
    await open(page, "/components/slider/")
    const thumb = page.locator("main input[type=range]").first().locator("xpath=..")
    const box = (await thumb.boundingBox())!
    const y = box.y + box.height / 2
    let x = box.x + box.width / 2
    await page.mouse.move(x, y)
    await page.mouse.down()
    for (let i = 0; i < 6; i++) {
      x += 20
      await page.mouse.move(x, y)
      await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))))
      const now = (await thumb.boundingBox())!
      expect(Math.abs(now.x + now.width / 2 - x), "the thumb stays under the pointer within a frame").toBeLessThanOrEqual(2)
      expect(await thumb.getAttribute("data-glide"), "dragging must not glide").toBeNull()
    }
    await page.mouse.up()
  })

  test("slider keyboard steps do not glide", async ({ page }) => {
    await open(page, "/components/slider/")
    const thumb = page.locator("main input[type=range]").first()
    await thumb.focus()
    const r = await record(page, `document.querySelector('main input[type=range]').parentElement`, ["left"], () => thumb.press("PageUp"), 500)
    expect(r.states, "a key step is one jump").toBeLessThanOrEqual(2)
    expect(await thumb.locator("xpath=..").getAttribute("data-glide")).toBeNull()
  })

  for (const reduced of [false, true]) {
    test.describe(reduced ? "reduced motion" : "full motion", () => {
      test.use({ reducedMotion: reduced ? "reduce" : "no-preference" })

      // The image answers late, so the fade is the thing sampled; CSS transition, so Chrome's animation clock can slow it.
      test("avatar fades in over its initials when the image arrives", async ({ page }) => {
        await page.route("**/avatars/ada.svg", async route => {
          await new Promise(r => setTimeout(r, 400))
          await route.continue()
        })
        const cdp = await page.context().newCDPSession(page)
        await cdp.send("Animation.enable")
        await cdp.send("Animation.setPlaybackRate", { playbackRate: reduced ? 1 : 0.25 })
        await page.addInitScript(() => {
          const frames: string[] = []
          ;(window as unknown as { __opacity: string[] }).__opacity = frames
          const tick = () => {
            const img = document.querySelector('main img[alt="Ada Lovelace"]')
            if (img) frames.push(getComputedStyle(img).opacity)
            requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        })
        await page.goto("/components/avatar/")
        await page.waitForFunction(() => (window as unknown as { __opacity: string[] }).__opacity.at(-1) === "1", null, { timeout: 5000 })
        const frames = await page.evaluate(() => (window as unknown as { __opacity: string[] }).__opacity)
        const states = frames.filter((v, i) => i === 0 || v !== frames[i - 1])
        console.log(`${reduced ? "[reduced] " : ""}avatar fade: ${states.length} states  ${states.join(" ")}`)
        // A fade is not movement, so it stays under reduced motion.
        expect(states.length, "the image should fade, not pop").toBeGreaterThanOrEqual(3)
        expect(states[0], "the image starts transparent over the initials").toBe("0")
        await expect(page.locator('main [role=img][aria-label="Ada Lovelace"]')).toHaveCount(0)
        await expect(page.locator('main img[alt="Ada Lovelace"]').first()).toBeVisible()
      })

      test("theme switch crossfades the page, or switches at once under reduced motion", async ({ page }) => {
        await open(page, "/components/button/")
        await page.evaluate(() => {
          const w = window as unknown as { __vt: number }
          w.__vt = 0
          const start = document.startViewTransition.bind(document)
          document.startViewTransition = ((cb: () => void) => (w.__vt++, start(cb))) as typeof document.startViewTransition
        })
        const button = page.locator('button[aria-label^="Theme:"]:visible').first()
        await button.click()
        await expect(button).toHaveAttribute("aria-label", "Theme: light") // final name on the click, not after the fade
        const started = await page.evaluate(() => (window as unknown as { __vt: number }).__vt)
        const duration = await page.evaluate(
          () =>
            new Promise<number | null>(resolve => {
              const t0 = performance.now()
              const look = () => {
                const a = document.getAnimations().find(a => (a.effect as KeyframeEffect | null)?.pseudoElement === "::view-transition-old(root)")
                if (a) resolve(Number(a.effect!.getTiming().duration))
                else if (performance.now() - t0 > 600) resolve(null)
                else requestAnimationFrame(look)
              }
              look()
            }),
        )
        console.log(`${reduced ? "[reduced] " : ""}theme: ${started} view transitions, crossfade ${duration}ms`)
        if (reduced) {
          expect(started, "no transition under reduced motion").toBe(0)
          expect(duration).toBeNull()
        } else {
          expect(started).toBe(1)
          expect(duration, "the crossfade runs on the moderate tier").toBe(ms("duration-moderate"))
        }
        await expect(page.locator("html")).toHaveClass(/light/) // the class lands inside the transition callback
      })
    })
  }

  test("avatar already in cache appears at once", async ({ page }) => {
    await open(page, "/components/avatar/")
    await expect(page.locator('main img[alt="Ada Lovelace"]').first()).toBeVisible()
    await page.evaluate(() => {
      const seen: string[] = []
      ;(window as unknown as { __seen: string[] }).__seen = seen
      new MutationObserver(records => {
        for (const node of records.flatMap(r => [...r.addedNodes])) {
          const img = node instanceof Element ? (node.matches("img") ? node : node.querySelector("img")) : null
          if (img?.getAttribute("alt") === "Ada Lovelace") seen.push(getComputedStyle(img).opacity)
        }
      }).observe(document.body, { childList: true, subtree: true })
    })
    await page.locator("aside nav").getByRole("link", { name: "Button", exact: true }).click()
    await page.waitForURL("**/components/button/")
    await page.locator("aside nav").getByRole("link", { name: "Avatar", exact: true }).click()
    await page.waitForURL("**/components/avatar/")
    await expect(page.locator('main img[alt="Ada Lovelace"]').first()).toBeVisible()
    const seen = await page.evaluate(() => (window as unknown as { __seen: string[] }).__seen)
    expect(seen.length, "the images mounted").toBeGreaterThan(0)
    expect(new Set(seen), "a cached image shows on its first frame").toEqual(new Set(["1"]))
  })

  test("tag removal hands focus to the next tag and makes the leaving tag inert", async ({ page }) => {
    await open(page, "/components/tag/")
    await page.getByRole("button", { name: "Remove Over $10k" }).focus()
    await page.evaluate(() => {
      const w = window as unknown as { __inert: boolean }
      new MutationObserver(() => (w.__inert ||= !!document.querySelector("main [data-tag][inert]"))).observe(document.body, { subtree: true, childList: true, attributes: true })
    })
    await page.keyboard.press("Enter")
    await expect.poll(() => page.evaluate(() => (window as unknown as { __inert?: boolean }).__inert), "the leaving tag is inert while it fades").toBe(true)
    await expect(page.getByRole("button", { name: "Remove Last 30 days" })).toBeFocused()
    await expect(page.locator("main [data-tag][inert]")).toHaveCount(0)
  })
})
