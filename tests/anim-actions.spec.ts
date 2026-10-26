import { expect, test, type Page } from "@playwright/test"
import { motionCases, ms, open, record, type Case } from "./helpers/motion"

// Actions group of fine 0.4's everyday animations: ConfirmButton, ReactionButton, NotificationBell. Motion cases go through
// motionCases() from ./helpers/motion (per-frame proof on the token, jump under reduced motion); keyboard and a11y cases are plain tests.

const slugs = ["confirm-button", "reaction-button", "notification-bell"]

test.use({ viewport: { width: 1440, height: 900 } })

test("actions pages hydrate and log no page errors", async ({ page }) => {
  const errors: string[] = []
  page.on("pageerror", e => errors.push(e.message))
  for (const slug of slugs) {
    await open(page, `/components/${slug}/`)
    await expect(page.locator("main h1")).toBeVisible()
  }
  expect(errors).toEqual([])
})

// The Discard draft example is the last ConfirmButton on its page; its question row is the labelled group inside it.
const confirmBox = `[...document.querySelectorAll('main [data-confirm-button]')].at(-1)`
const confirmRow = `${confirmBox}.querySelector('[role=group]')`
const confirmTrigger = `${confirmBox}.querySelector('button')`
const draft = (p: Page) => p.locator("main [data-confirm-button]").last()
const openDraft = async (p: Page) => {
  await p.getByRole("button", { name: "Discard draft" }).click()
  await p.waitForTimeout(500)
}

/** The rolling glyph of a figure showing `text` (the one entering when a digit changes). */
const glyph = (figure: string, text: string) => `[...${figure}.querySelectorAll('[aria-hidden] .col-start-1')].filter(g => g.textContent === '${text}').pop()`
const likeFigure = `document.querySelector('main button[aria-pressed] span.figures.relative')`
const badgeFigure = `document.querySelector('main [data-badge] span.figures.relative')`


/** Every frame's value of `read(el)` for the element `target` returns, from just before `act` until `ms` after it. */
async function track(page: Page, target: string, read: string, act: () => Promise<void>, ms: number) {
  const sampling = page.evaluate(
    ({ target, read, ms }) =>
      new Promise<number[]>(resolve => {
        const find = new Function(`return ${target}`) as () => Element | null
        const get = new Function("el", `return (${read})(el)`) as (el: Element) => number
        const values: number[] = []
        const t0 = performance.now()
        const tick = () => {
          const el = find()
          if (el) values.push(get(el))
          if (performance.now() - t0 < ms) requestAnimationFrame(tick)
          else resolve(values)
        }
        requestAnimationFrame(tick)
      }),
    { target, read, ms },
  )
  await page.waitForTimeout(40)
  await act()
  return sampling
}
/** Rotation in degrees and scale of a computed matrix transform. */
const angle = `el => { const m = getComputedStyle(el).transform; if (!m.startsWith("matrix(")) return 0; const [a, b] = m.slice(7, -1).split(",").map(Number); return Math.atan2(b, a) * 180 / Math.PI }`
const scaleOf = `el => { const m = getComputedStyle(el).transform; if (!m.startsWith("matrix(")) return 1; const [a, b] = m.slice(7, -1).split(",").map(Number); return Math.hypot(a, b) }`

const cases: Case[] = [
  {
    name: "confirm button widens into the question (moderate tier spring)",
    js: true,
    path: "/components/confirm-button/",
    target: confirmBox,
    props: ["width"],
    token: ms("duration-moderate"),
    movement: true,
    act: p => p.getByRole("button", { name: "Discard draft" }).click(),
  },
  {
    name: "confirm button collapses on Cancel (moderate exit)",
    js: true,
    path: "/components/confirm-button/",
    target: confirmBox,
    props: ["width"],
    token: ms("duration-moderate-exit"),
    movement: true,
    setup: openDraft,
    act: p => draft(p).getByRole("button", { name: "Cancel" }).click(),
  },
  {
    name: "confirm question fades in (moderate tier)",
    path: "/components/confirm-button/",
    target: confirmRow,
    props: ["opacity"],
    token: ms("duration-moderate"),
    movement: false,
    act: p => p.getByRole("button", { name: "Discard draft" }).click(),
  },
  {
    name: "confirm trigger leaves on the fast exit",
    path: "/components/confirm-button/",
    target: confirmTrigger,
    props: ["opacity"],
    token: ms("duration-fast-exit"),
    movement: false,
    act: p => p.getByRole("button", { name: "Discard draft" }).click(),
  },
  {
    name: "reaction icon settles from 0.85 (fast tier spring)",
    js: true,
    path: "/components/reaction-button/",
    target: `document.querySelector('main [data-reaction-icon]')`,
    props: ["transform"],
    token: ms("duration-fast"),
    movement: true,
    act: p => p.getByRole("button", { name: "Like, 12" }).click(),
  },
  {
    name: "reaction icon fills (fast tier)",
    path: "/components/reaction-button/",
    target: `document.querySelector('main [data-reaction-icon] svg')`,
    props: ["fill"],
    token: ms("duration-fast"),
    movement: false,
    act: p => p.getByRole("button", { name: "Like, 12" }).click(),
  },
  {
    name: "reaction count rolls (moderate tier spring)",
    js: true,
    path: "/components/reaction-button/",
    target: glyph(likeFigure, "3"),
    props: ["opacity", "transform"],
    token: ms("duration-moderate"),
    movement: true,
    act: p => p.getByRole("button", { name: "Like, 12" }).click(),
  },
  {
    name: "bell swings from its top pivot (expressive tier spring)",
    js: true,
    path: "/components/notification-bell/",
    target: `document.querySelector('main [data-bell]')`,
    props: ["transform"],
    token: ms("duration-expressive"),
    movement: true,
    act: p => p.getByRole("button", { name: "New message" }).click(),
  },
  {
    name: "badge pops in from zero (fast tier spring)",
    js: true,
    path: "/components/notification-bell/",
    target: `document.querySelector('main [data-badge]')`,
    props: ["opacity", "transform"],
    token: ms("duration-fast"),
    movement: true,
    setup: async p => {
      await p.getByRole("button", { name: "Mark all read" }).click()
      await p.waitForTimeout(600)
    },
    act: p => p.getByRole("button", { name: "New message" }).click(),
  },
  {
    name: "badge leaves on the fast exit",
    js: true,
    path: "/components/notification-bell/",
    target: `document.querySelector('main [data-badge]')`,
    props: ["opacity", "transform"],
    token: ms("duration-fast-exit"),
    movement: true,
    act: p => p.getByRole("button", { name: "Mark all read" }).click(),
  },
  {
    name: "bell count rolls (moderate tier spring)",
    js: true,
    path: "/components/notification-bell/",
    target: glyph(badgeFigure, "4"),
    props: ["opacity", "transform"],
    token: ms("duration-moderate"),
    movement: true,
    act: p => p.getByRole("button", { name: "New message" }).click(),
  },
]

motionCases(cases)

test.describe("confirm button", () => {
  const trigger = (p: Page) => p.getByRole("button", { name: "Discard draft" })

  test("Enter opens the question, focus lands on Cancel, Escape closes it and returns focus to the trigger", async ({ page }) => {
    await open(page, "/components/confirm-button/")
    await trigger(page).focus()
    await page.keyboard.press("Enter")
    const group = page.getByRole("group", { name: "Discard this draft?" })
    await expect(group).toBeVisible()
    await expect(group.getByRole("button", { name: "Cancel" })).toBeFocused()
    await page.keyboard.press("Escape")
    await expect(trigger(page)).toBeFocused()
    await expect(group).toHaveAttribute("inert", "")
  })

  test("Cancel closes it and returns focus to the trigger without confirming", async ({ page }) => {
    await open(page, "/components/confirm-button/")
    await trigger(page).click()
    await draft(page).getByRole("button", { name: "Cancel" }).click()
    await expect(trigger(page)).toBeFocused()
    await expect(page.getByRole("button", { name: "Start a new draft" })).toHaveCount(0)
  })

  test("only the face that is showing is reachable: Tab runs Cancel to Confirm, and the hidden trigger is inert", async ({ page }) => {
    await open(page, "/components/confirm-button/")
    // Closed: the question row is inert, so Tab from the trigger never lands in it.
    await trigger(page).focus()
    await expect(draft(page).getByRole("group")).toHaveAttribute("inert", "")
    await trigger(page).click()
    await expect(draft(page).getByRole("button", { name: "Cancel" })).toBeFocused()
    await page.keyboard.press("Tab")
    await expect(draft(page).getByRole("button", { name: "Discard", exact: true })).toBeFocused()
    expect(await trigger(page).evaluate(el => el.hasAttribute("inert") || el.closest("[inert]") !== null)).toBe(true)
  })

  test("Confirm shows loading while onConfirm is pending, then collapses and returns focus", async ({ page }) => {
    await open(page, "/components/confirm-button/")
    await trigger(page).click()
    const confirm = draft(page).getByRole("button", { name: "Discard", exact: true })
    await confirm.click()
    await expect(confirm).toHaveAttribute("aria-busy", "true")
    await expect(draft(page).getByRole("button", { name: "Cancel" })).toBeDisabled()
    await expect(page.getByRole("button", { name: "Start a new draft" })).toBeVisible({ timeout: 4000 })
    await expect(trigger(page)).toBeFocused()
    await expect(draft(page).getByRole("group")).toHaveAttribute("inert", "")
  })

  test("Confirm on a synchronous action runs it once and collapses", async ({ page }) => {
    await open(page, "/components/confirm-button/")
    const rows = page.locator("main [data-confirm-button]")
    await expect(rows).toHaveCount(4)
    await rows.first().getByRole("button", { name: "Delete", exact: true }).first().click()
    await rows.first().getByRole("group").getByRole("button", { name: "Delete" }).click()
    await expect(rows).toHaveCount(3)
    await expect(page.locator("main span.figures", { hasText: "2041" })).toHaveCount(0)
  })
})

test.describe("reaction button", () => {
  test("pressing starts the icon at 0.85 and settles at 1, never smaller", async ({ page }) => {
    await open(page, "/components/reaction-button/")
    const scales = await track(page, `document.querySelector('main [data-reaction-icon]')`, scaleOf, () => page.getByRole("button", { name: "Like, 12" }).click(), 400)
    expect(Math.min(...scales), "the press dips the icon").toBeLessThan(0.97)
    expect(Math.min(...scales), "to 0.85, no further").toBeGreaterThanOrEqual(0.84)
    expect(scales.at(-1)).toBe(1)
  })

  test("aria-pressed and the name carry the state and the count; Space and Enter both toggle", async ({ page }) => {
    await open(page, "/components/reaction-button/")
    const like = page.getByRole("button", { name: /^Like, / })
    await expect(like).toHaveAttribute("aria-pressed", "false")
    await expect(like).toHaveAccessibleName("Like, 12")
    await like.focus()
    await page.keyboard.press("Space")
    await expect(like).toHaveAttribute("aria-pressed", "true")
    await expect(like).toHaveAccessibleName("Like, 13") // on the frame of the press, not after the roll
    await page.keyboard.press("Enter")
    await expect(like).toHaveAttribute("aria-pressed", "false")
    await expect(like).toHaveAccessibleName("Like, 12")
  })

  test("a button that starts pressed counts itself", async ({ page }) => {
    await open(page, "/components/reaction-button/")
    await expect(page.getByRole("button", { name: "Star, 2,000" })).toHaveAttribute("aria-pressed", "true")
  })
})

test.describe("notification bell", () => {
  const bell = (p: Page) => p.getByRole("button", { name: /^Notifications, \d+ unread$|^Notifications$/ }).first()
  const status = (p: Page) => p.locator("main [role=status]").first()

  test("the name and the polite live region follow the count, and the badge goes at zero", async ({ page }) => {
    await open(page, "/components/notification-bell/")
    await expect(bell(page)).toHaveAccessibleName("Notifications, 3 unread")
    await expect(status(page)).toHaveAttribute("aria-live", "polite")
    await expect(status(page)).toHaveText("Notifications, 3 unread")
    await page.getByRole("button", { name: "New message" }).click()
    await expect(bell(page)).toHaveAccessibleName("Notifications, 4 unread")
    await expect(status(page)).toHaveText("Notifications, 4 unread")
    await page.getByRole("button", { name: "Mark all read" }).click()
    await expect(bell(page)).toHaveAccessibleName("Notifications")
    await expect(status(page)).toHaveText("Notifications, none unread")
    await expect(bell(page).locator("[data-badge]")).toHaveCount(0)
  })

  test("the badge caps at 99+ and the name says the same", async ({ page }) => {
    await open(page, "/components/notification-bell/")
    const busy = page.getByRole("button", { name: "Notifications, 99+ unread" })
    await expect(busy).toBeVisible()
    // The sr-only copy and the rolling glyphs both sit in the badge, so read the glyphs the way a sighted user sees them.
    const shown = await busy.locator("[data-badge]").evaluate(b => [...b.querySelectorAll("[aria-hidden] .col-start-1")].map(g => g.textContent).join("") + (b.textContent?.endsWith("+") ? "+" : ""))
    expect(shown).toBe("99+")
  })

  test("the swing goes both ways by about 12 degrees from a pivot at the top of the bell", async ({ page }) => {
    await open(page, "/components/notification-bell/")
    const angles = await track(page, `document.querySelector('main [data-bell]')`, angle, () => page.getByRole("button", { name: "New message" }).click(), 1200)
    expect(Math.max(...angles), "swings one way").toBeGreaterThan(9)
    expect(Math.min(...angles), "then the other").toBeLessThan(-9)
    expect(Math.max(...angles.map(Math.abs)), "and stays near 12").toBeLessThan(14)
    expect(angles.at(-1)).toBeCloseTo(0, 1)
    const originY = await page.locator("main [data-bell]").first().evaluate(el => parseFloat(getComputedStyle(el).transformOrigin.split(" ")[1]) / el.getBoundingClientRect().height)
    expect(originY, "the pivot sits near the top edge").toBeLessThan(0.2)
  })

  test("the badge pops in from scale 0", async ({ page }) => {
    await open(page, "/components/notification-bell/")
    await page.getByRole("button", { name: "Mark all read" }).click()
    await page.waitForTimeout(600)
    const scales = await track(page, `document.querySelector('main [data-badge]')`, scaleOf, () => page.getByRole("button", { name: "New message" }).click(), 400)
    expect(Math.min(...scales)).toBeLessThan(0.6)
    expect(scales.at(-1)).toBe(1)
  })

  test("a fall rolls the count but never swings the bell", async ({ page }) => {
    await open(page, "/components/notification-bell/")
    const r = await record(page, `document.querySelector('main [data-bell]')`, ["transform"], () => page.getByRole("button", { name: "Read one" }).click(), 900)
    expect(r.states, "the bell stays still when the count falls").toBe(1)
  })

  test("a rise during a swing carries on with it instead of restarting", async ({ page }) => {
    await open(page, "/components/notification-bell/")
    const add = page.getByRole("button", { name: "New message" })
    const target = `document.querySelector('main [data-bell]')`
    const single = await record(page, target, ["transform"], () => add.click(), 1500)
    await page.waitForTimeout(500)
    const double = await record(
      page,
      target,
      ["transform"],
      async () => {
        await add.click()
        await page.waitForTimeout(150)
        await add.click()
      },
      1500,
    )
    expect(single.states, "a rise swings").toBeGreaterThanOrEqual(3)
    // Both swings end at the same time after their first click; a restart at 150ms would end about 150ms later.
    expect(double.span, "the second rise must not extend the swing").toBeLessThanOrEqual(single.span + 100)
  })
})
