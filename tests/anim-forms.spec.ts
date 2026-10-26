import { expect, test, type Page } from "@playwright/test"
import { motionCases, ms, open, type Case } from "./helpers/motion"

// Forms group of fine 0.4's everyday animations: PasswordInput and OtpInput. Motion cases go through
// motionCases() from ./helpers/motion (per-frame proof on the token, jump under reduced motion); the
// keyboard and a11y cases are plain tests.

const slugs = ["password-input", "otp-input"]

test.use({ viewport: { width: 1440, height: 900 } })

test("forms pages hydrate and log no page errors", async ({ page }) => {
  const errors: string[] = []
  page.on("pageerror", e => errors.push(e.message))
  for (const slug of slugs) {
    await open(page, `/components/${slug}/`)
    await expect(page.locator("main h1")).toBeVisible()
  }
  expect(errors).toEqual([])
})

// The Nth live example's strength meter, its Nth fill segment, and the Nth OTP row and slot.
const fillOf = (meter: number, seg: number) =>
  `document.querySelectorAll('main [data-strength-meter]')[${meter}].querySelectorAll('[data-fill]')[${seg}]`
const otp = (n: number) => `document.querySelectorAll('main [data-otp]')[${n}]`
const slotOf = (n: number, i: number) => `${otp(n)}.querySelectorAll('[data-otp-slot]')[${i}]`

/** Chrome's animation clock at 0.25x, so a 40ms stagger spans several frames even when the page's main thread stalls. */
async function slow(page: Page) {
  const cdp = await page.context().newCDPSession(page)
  await cdp.send("Animation.enable")
  await cdp.send("Animation.setPlaybackRate", { playbackRate: 0.25 })
}

const password = (p: Page) => p.locator("main input").first()
const code = (p: Page) => p.locator("main [data-otp] input").first()
const strong = "Abcdefgh1234!"

const cases: Case[] = [
  {
    name: "password eye swaps icons (fast tier, scale and fade)",
    js: true,
    path: "/components/password-input/",
    target: `document.querySelector('main [data-eye="closed"]')`,
    props: ["opacity", "transform"],
    token: ms("duration-fast"),
    movement: true,
    act: p => p.getByRole("button", { name: "Show password" }).first().click(),
  },
  {
    name: "password strength segment fills from the left (moderate tier)",
    path: "/components/password-input/",
    target: fillOf(0, 0),
    props: ["scale"],
    token: ms("duration-moderate"),
    movement: true,
    act: p => password(p).pressSequentially("a"),
  },
  {
    name: "password strength color fades to the level's status color",
    path: "/components/password-input/",
    target: fillOf(0, 0),
    props: ["background-color"],
    token: ms("duration-moderate"),
    movement: false,
    setup: async p => {
      await password(p).fill("abcdefgh") // level 1, danger
      await p.waitForTimeout(500)
    },
    act: p => password(p).fill("abcdefghijkl"), // level 2, warning
  },
  {
    name: "otp digit rolls up into its slot (moderate tier)",
    js: true,
    path: "/components/otp-input/",
    target: `${slotOf(0, 0)}.querySelector('span')`,
    props: ["opacity", "transform"],
    token: ms("duration-moderate"),
    movement: true,
    act: p => code(p).pressSequentially("1"),
  },
  {
    name: "otp deleted digit rolls out downward (moderate exit)",
    js: true,
    path: "/components/otp-input/",
    target: `${slotOf(0, 0)}.querySelector('span')`,
    props: ["opacity", "transform"],
    token: ms("duration-moderate-exit"),
    movement: true,
    setup: async p => {
      await code(p).pressSequentially("1")
      await p.waitForTimeout(500)
    },
    act: p => p.keyboard.press("Backspace"),
  },
  {
    name: "otp ring slides to the next slot (moderate tier)",
    path: "/components/otp-input/",
    target: `${otp(0)}.querySelector('[data-otp-caret]')`,
    props: ["translate"],
    token: ms("duration-moderate"),
    movement: true,
    act: p => code(p).pressSequentially("1"),
  },
  {
    name: "otp invalid shakes the row (slow tier tween)",
    js: true,
    path: "/components/otp-input/",
    target: otp(0),
    props: ["transform"],
    token: ms("duration-slow"),
    movement: true,
    act: p => code(p).pressSequentially("000000"),
  },
]

motionCases(cases)

test.describe("password input", () => {
  test.beforeEach(async ({ page }) => open(page, "/components/password-input/"))

  test("the toggle flips the type, its name and aria-pressed while the icons are still swapping", async ({ page }) => {
    const toggle = page.getByRole("button", { name: "Show password" }).first()
    await expect(toggle).toHaveAttribute("aria-pressed", "false")
    await expect(password(page)).toHaveAttribute("type", "password")
    const frame = await toggle.evaluate(async el => {
      ;(el as HTMLElement).click()
      await new Promise(requestAnimationFrame)
      const input = el.parentElement!.querySelector("input")!
      return {
        label: el.getAttribute("aria-label"),
        pressed: el.getAttribute("aria-pressed"),
        type: input.type,
        icons: el.querySelectorAll("[data-eye]").length, // both: the old one is still leaving
      }
    })
    expect(frame).toEqual({ label: "Hide password", pressed: "true", type: "text", icons: 2 })
  })

  test("the toggle works from the keyboard and keeps the typed value", async ({ page }) => {
    await password(page).fill(strong)
    await password(page).press("Tab")
    await expect(page.getByRole("button", { name: "Show password" }).first()).toBeFocused()
    await page.keyboard.press("Enter")
    await expect(password(page)).toHaveAttribute("type", "text")
    await expect(password(page)).toHaveValue(strong)
    await page.keyboard.press("Space")
    await expect(password(page)).toHaveAttribute("type", "password")
    await expect(page.getByRole("button", { name: "Show password" }).first()).toBeFocused()
  })

  test("the strength label is a polite live region the input is described by, next to the Field hint", async ({ page }) => {
    const live = page.locator("main p[aria-live=polite]").first()
    await expect(live).toHaveText("")
    await password(page).fill("abcdefgh")
    await expect(live).toHaveText("Weak")
    await password(page).fill("abcdefghijkl")
    await expect(live).toHaveText("Fair")
    await password(page).fill(strong)
    await expect(live).toHaveText("Strong")
    const described = await password(page).evaluate(el =>
      (el.getAttribute("aria-describedby") ?? "").split(" ").map(id => document.getElementById(id)?.textContent),
    )
    expect(described).toContain("Strong")
    expect(described).toContain("At least 12 characters.")
  })

  test("the meter fills as many segments as the level and only when asked for", async ({ page }) => {
    const levels = page.locator("main [data-strength-meter]")
    await expect(levels).toHaveCount(5) // the sign up example and the four fixed levels
    for (let level = 1; level <= 4; level++) {
      await expect(levels.nth(level).locator("[data-fill][data-on]")).toHaveCount(level)
    }
    await expect(levels.nth(0).locator("[data-fill][data-on]")).toHaveCount(0)
    await password(page).fill(strong)
    await expect(levels.nth(0).locator("[data-fill][data-on]")).toHaveCount(4)
    // The sign in example has no scorer: no meter and no live region of its own.
    const signIn = page.locator("main input").nth(1).locator("xpath=ancestor::*[contains(@class,'grid')][1]")
    await expect(signIn.locator("[data-strength-meter]")).toHaveCount(0)
  })

  test("the segments fill left to right, 40ms apart", async ({ page }) => {
    await slow(page)
    const times = await page.evaluate(
      ({ target }) =>
        new Promise<number[]>(resolve => {
          const fills = [...(new Function(`return ${target}`)() as Element).querySelectorAll("[data-fill]")]
          const first = fills.map(el => getComputedStyle(el).scale)
          const at: number[] = []
          const input = document.querySelector<HTMLInputElement>("main input")!
          const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!
          const t0 = performance.now()
          set.call(input, "Abcdefgh1234!")
          input.dispatchEvent(new Event("input", { bubbles: true }))
          const tick = () => {
            fills.forEach((el, i) => {
              if (at[i] === undefined && getComputedStyle(el).scale !== first[i]) at[i] = performance.now() - t0
            })
            if (at.filter(Boolean).length === fills.length || performance.now() - t0 > 4000) resolve(at)
            else requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        }),
      { target: `document.querySelectorAll('main [data-strength-meter]')[0]` },
    )
    expect(times).toHaveLength(4)
    expect(times[1]).toBeGreaterThan(times[0])
    expect(times[2]).toBeGreaterThan(times[1])
    expect(times[3]).toBeGreaterThan(times[2])
    expect(times[3] - times[0], "four segments span about three staggers (160ms each at 0.25x)").toBeGreaterThanOrEqual(400)
  })
})

test.describe("otp input", () => {
  test.beforeEach(async ({ page }) => open(page, "/components/otp-input/"))

  // Slot text of the Nth row; a leaving digit stays in its slot for the length of its exit.
  const error = (page: Page) => page.locator("main .text-danger-subtle-foreground", { hasText: "That code is not right." })
  const digits = (page: Page, n: number) =>
    page.evaluate(n => [...document.querySelectorAll("main [data-otp]")[n].querySelectorAll("[data-otp-slot]")].map(s => s.textContent), n)

  test("one labelled input drives the slots", async ({ page }) => {
    await expect(page.locator("main [data-otp]").first().locator("input")).toHaveCount(1)
    const input = page.getByRole("textbox", { name: "Verification code" })
    await expect(input).toHaveAttribute("autocomplete", "one-time-code")
    await expect(input).toHaveAttribute("inputmode", "numeric")
    await input.click()
    await page.keyboard.type("48")
    await expect.poll(() => digits(page, 0)).toEqual(["4", "8", "", "", "", ""])
    await page.keyboard.press("Backspace")
    await expect(input).toHaveValue("4")
  })

  test("only digits get in, and a paste fills every slot", async ({ page }) => {
    const input = page.getByRole("textbox", { name: "Verification code" })
    await input.click()
    await page.keyboard.type("a1b2")
    await expect(input).toHaveValue("12")
    await input.fill("")
    await page.keyboard.insertText("482-913 55")
    await expect(input).toHaveValue("482913")
    await expect.poll(() => digits(page, 0)).toEqual(["4", "8", "2", "9", "1", "3"])
  })

  test("new digits land after the last one, wherever the caret was put", async ({ page }) => {
    const input = page.getByRole("textbox", { name: "Verification code" })
    await input.click()
    await page.keyboard.type("123")
    await page.keyboard.press("ArrowLeft")
    await page.keyboard.press("Home")
    await page.keyboard.type("4")
    await expect(input).toHaveValue("1234")
  })

  test("the ring follows the next empty slot and shows only while focused", async ({ page }) => {
    const input = page.getByRole("textbox", { name: "Verification code" })
    const ring = page.locator("main [data-otp-caret]").first()
    await expect(ring).toHaveCSS("opacity", "0")
    await input.click()
    await expect(ring).toHaveCSS("opacity", "1")
    await page.keyboard.type("12")
    const left = (sel: string, i: number) => page.locator("main [data-otp]").first().locator(sel).nth(i).evaluate(el => el.getBoundingClientRect().x)
    const pitch = (await left("[data-otp-slot]", 2)) - (await left("[data-otp-slot]", 0))
    await expect.poll(async () => Math.round((await left("[data-otp-caret]", 0)) - (await left("[data-otp-slot]", 0)))).toBe(Math.round(pitch))
    await page.locator("main h1").click()
    await expect(ring).toHaveCSS("opacity", "0")
  })

  test("a wrong code marks the input invalid and the slots danger, editing clears it", async ({ page }) => {
    const input = page.getByRole("textbox", { name: "Verification code" })
    await input.click()
    await page.keyboard.type("000000")
    await expect(input).toHaveAttribute("aria-invalid", "true")
    await expect(page.locator("main [data-otp-slot][data-state=invalid]")).toHaveCount(6)
    await expect(error(page)).toBeVisible()
    await page.keyboard.press("Backspace")
    await expect(page.locator("main [data-otp-slot][data-state=invalid]")).toHaveCount(0)
    await expect(error(page)).toHaveCount(0)
  })

  test("the right code turns every border success, left to right, each on the fast tier", async ({ page }) => {
    await code(page).click()
    await page.waitForTimeout(500) // the hover tint settles before the run is measured
    await slow(page)
    const runs = await page.evaluate(
      () =>
        new Promise<{ from: number; to: number }[]>(resolve => {
          // Serialization of a color changes at the start of a transition (lab to oklab) with no visible change, so compare pixels.
          const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true })!
          const rgb = (c: string) => {
            ctx.clearRect(0, 0, 1, 1)
            ctx.fillStyle = "#000"
            ctx.fillStyle = c
            ctx.fillRect(0, 0, 1, 1)
            return ctx.getImageData(0, 0, 1, 1).data.join(",")
          }
          const slots = [...document.querySelectorAll("main [data-otp]")[0].querySelectorAll("[data-otp-slot]")]
          const first = slots.map(s => rgb(getComputedStyle(s).borderTopColor))
          const last = slots.map(() => first[0])
          const runs = slots.map(() => ({ from: NaN, to: NaN }))
          const input = document.querySelector<HTMLInputElement>("main [data-otp] input")!
          const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!
          const t0 = performance.now()
          set.call(input, "123456")
          input.dispatchEvent(new Event("input", { bubbles: true }))
          const tick = () => {
            const now = performance.now() - t0
            slots.forEach((s, i) => {
              const c = rgb(getComputedStyle(s).borderTopColor)
              if (c !== (Number.isNaN(runs[i].from) ? first[i] : last[i])) {
                if (Number.isNaN(runs[i].from)) runs[i].from = now
                runs[i].to = now
              }
              last[i] = c
            })
            if (now > 4500) resolve(runs)
            else requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        }),
    )
    for (let i = 1; i < 6; i++) expect(runs[i].from, `slot ${i} starts after slot ${i - 1}`).toBeGreaterThan(runs[i - 1].from)
    expect(runs[5].from - runs[0].from, "six slots start about five staggers apart (160ms each at 0.25x)").toBeGreaterThanOrEqual(600)
    for (const [i, r] of runs.entries()) expect(r.to - r.from, `slot ${i} settles within the fast tier (x4)`).toBeLessThanOrEqual(ms("duration-fast") * 4 + 120)
    await expect(page.locator("main [data-otp-slot][data-state=success]")).toHaveCount(6)
    await expect(page.getByRole("textbox", { name: "Verification code" })).not.toHaveAttribute("aria-invalid", "true")
  })

  test("onComplete fires once per full code, not on every key at full length", async ({ page }) => {
    const pin = page.getByRole("textbox", { name: "PIN" })
    const toasts = page.locator("[role=dialog][data-type]")
    await pin.click()
    await page.keyboard.type("1234")
    await expect(toasts).toHaveCount(1)
    await page.keyboard.type("56") // already full: nothing changes, nothing fires
    await page.waitForTimeout(300)
    await expect(toasts).toHaveCount(1)
    await expect(pin).toHaveValue("1234")
    await page.keyboard.press("Backspace")
    await page.keyboard.type("9")
    await expect(toasts).toHaveCount(2)
  })

  test("a controlled value can be cleared from outside and the slots empty", async ({ page }) => {
    const pin = page.getByRole("textbox", { name: "PIN" })
    await pin.click()
    await page.keyboard.type("1234")
    await page.getByRole("button", { name: "Clear" }).click()
    await expect(pin).toHaveValue("")
    await expect.poll(() => digits(page, 1)).toEqual(["", "", "", ""])
  })
})
