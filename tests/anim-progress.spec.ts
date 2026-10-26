import { expect, test } from "@playwright/test"
import { motionCases, ms, open, record, type Case } from "./helpers/motion"

// Progress group of fine 0.4's everyday animations. Motion cases go through motionCases() from ./helpers/motion
// (per-frame proof on the token, jump under reduced motion); keyboard and a11y cases are plain tests.

const slugs = ["checklist", "stepper"]

test.use({ viewport: { width: 1440, height: 900 } })

test("progress pages hydrate and log no page errors", async ({ page }) => {
  const errors: string[] = []
  page.on("pageerror", e => errors.push(e.message))
  for (const slug of slugs) {
    await open(page, `/components/${slug}/`)
    await expect(page.locator("main h1")).toBeVisible()
  }
  expect(errors).toEqual([])
})

/** A checklist item by its label. Its position changes when it moves, so it is looked up by text on every frame. */
const item = (text: string) => `[...document.querySelectorAll('main [data-checklist-item]')].find(li => li.textContent.includes('${text}'))`
const strike = (text: string) => `[...document.querySelectorAll('main [data-strike]')].find(s => s.textContent === '${text}')`
const verify = "Verify your email"
const notes = "Post the release notes"
const nth = (selector: string, n: number) => `document.querySelectorAll('main ${selector}')[${n}]`

const cases: Case[] = [
  {
    name: "checklist strike draws across the label (moderate tier)",
    path: "/components/checklist/",
    target: strike(notes),
    props: ["background-size"],
    token: ms("duration-moderate"),
    movement: true,
    // The Release list stays in place; in the Setup list the item moves at the end of the strike, which resets a running transition.
    act: p => p.getByRole("checkbox", { name: notes }).click(),
  },
  {
    name: "checklist item glides to the end (moderate tier spring)",
    js: true,
    path: "/components/checklist/",
    target: item(verify),
    props: ["transform"],
    token: ms("duration-moderate"),
    movement: true,
    window: 1200,
    act: p => p.getByRole("checkbox", { name: verify }).click(),
  },
  {
    name: "stepper marker check draws (fast tier)",
    path: "/components/stepper/",
    target: nth("[data-step-check]", 1),
    props: ["stroke-dashoffset"],
    token: ms("duration-fast"),
    movement: true,
    act: p => p.getByRole("button", { name: "Continue" }).click(),
  },
  {
    name: "stepper connector fills from its start edge (moderate tier)",
    path: "/components/stepper/",
    target: nth("[data-connector-fill]", 1),
    props: ["scale"],
    token: ms("duration-moderate"),
    movement: true,
    act: p => p.getByRole("button", { name: "Continue" }).click(),
  },
  {
    name: "stepper vertical connector fills downward (moderate tier)",
    path: "/components/stepper/",
    target: nth("[data-orientation=vertical] [data-connector-fill]", 0),
    props: ["scale"],
    token: ms("duration-moderate"),
    movement: true,
    act: p => p.getByRole("button", { name: "Next step" }).click(),
  },
  {
    name: "stepper ring travels to the next marker (moderate tier spring, after the fast check)",
    js: true,
    path: "/components/stepper/",
    target: nth("[data-step-ring]", 0),
    props: ["transform"],
    token: ms("duration-moderate") + ms("duration-fast"),
    movement: true,
    act: p => p.getByRole("button", { name: "Continue" }).click(),
  },
]

motionCases(cases)

test.describe("checklist", () => {
  const order = (page: import("@playwright/test").Page) => page.locator("main ul").first().locator("li").allInnerTexts()

  test("is a list of labelled checkboxes that Space toggles", async ({ page }) => {
    await open(page, "/components/checklist/")
    const list = page.locator("main ul").first()
    await expect(list.locator("li")).toHaveCount(4)
    const box = page.getByRole("checkbox", { name: verify })
    await box.focus()
    await expect(box).not.toBeChecked()
    await page.keyboard.press("Space")
    await expect(box).toBeChecked()
    await page.keyboard.press("Space")
    await expect(box).not.toBeChecked()
  })

  test("the item draws its strike first and moves to the end after it", async ({ page }) => {
    await open(page, "/components/checklist/")
    // Same task as the click: the strike has not finished, so the item must still be where it was.
    const at = await page.evaluate(label => {
      const box = [...document.querySelectorAll<HTMLElement>("main [role=checkbox]")].find(b => b.parentElement?.textContent?.includes(label))!
      box.click()
      return [...document.querySelectorAll("main ul")[0].children].map(li => li.textContent)
    }, verify)
    expect(at[0]).toBe(verify)
    await expect.poll(async () => (await order(page)).at(-1)).toBe(verify)
    // The invoice item was done on load and sits in front of it; the rest keep their order.
    expect(await order(page)).toEqual(["Add a payment method", "Invite your team", "Send your first invoice", verify])
  })

  test("the order change keeps focus on the item that moved", async ({ page }) => {
    await open(page, "/components/checklist/")
    const box = page.getByRole("checkbox", { name: verify })
    await box.focus()
    await page.keyboard.press("Space")
    await expect.poll(async () => (await order(page)).at(-1)).toBe(verify)
    await expect(box).toBeFocused()
    await page.keyboard.press("Space") // and it can be unchecked from where it landed
    await expect(box).not.toBeChecked()
    await expect.poll(async () => (await order(page))[0]).toBe(verify)
    await expect(box).toBeFocused()
  })

  test("a list without moveCompletedToEnd keeps its order", async ({ page }) => {
    await open(page, "/components/checklist/")
    const second = page.locator("main ul").nth(1)
    const before = await second.locator("li").allInnerTexts()
    await page.getByRole("checkbox", { name: notes }).click()
    await page.waitForTimeout(600)
    expect(await second.locator("li").allInnerTexts()).toEqual(before)
    await expect(page.getByRole("checkbox", { name: notes })).toBeChecked()
  })

  test("reduced motion keeps the label colour fade and drops the draw", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1440, height: 900 } })
    const page = await context.newPage()
    await open(page, "/components/checklist/")
    const r = await record(page, strike(verify), ["color"], () => page.getByRole("checkbox", { name: verify }).click(), 600)
    expect(r.states, "the colour still fades").toBeGreaterThanOrEqual(3)
    await context.close()
  })
})

test.describe("stepper", () => {
  const steps = (page: import("@playwright/test").Page) => page.locator("main ol").first().locator("> li")

  test("is an ordered list with one current step and completed steps named as such", async ({ page }) => {
    await open(page, "/components/stepper/")
    const list = page.locator("main ol").first()
    await expect(list.locator("> li")).toHaveCount(3)
    await expect(list.locator('[aria-current="step"]')).toHaveCount(1)
    await expect(steps(page).nth(1)).toHaveAttribute("aria-current", "step")
    await expect(list).toMatchAriaSnapshot(`
      - list:
        - listitem: Cart completed
        - listitem: Shipping
        - listitem: Payment
    `)
  })

  test("moving on completes the step, moves aria-current and, past the end, completes all", async ({ page }) => {
    await open(page, "/components/stepper/")
    const next = page.getByRole("button", { name: "Continue" })
    await next.click()
    await expect(steps(page).nth(2)).toHaveAttribute("aria-current", "step")
    await expect(steps(page).nth(1)).toContainText("completed")
    await expect(steps(page).nth(1)).not.toHaveAttribute("aria-current", "step")
    await next.click()
    await expect(page.locator('main ol').first().locator('[aria-current="step"]')).toHaveCount(0)
    await expect(steps(page).nth(2)).toContainText("completed")
    await page.getByRole("button", { name: "Back" }).click()
    await expect(steps(page).nth(2)).toHaveAttribute("aria-current", "step")
    await expect(steps(page).nth(2)).not.toContainText("completed")
  })

  test("nothing animates on first render", async ({ page }) => {
    await open(page, "/components/stepper/")
    const running = await page.evaluate(() => document.querySelector("main ol")!.getAnimations({ subtree: true }).filter(a => a.playState === "running").length)
    expect(running).toBe(0)
    await expect(steps(page).first().locator("[data-step-check]")).toHaveCSS("stroke-dashoffset", "0px")
  })

  test("going back retracts the connector and the vertical stepper follows the same rules", async ({ page }) => {
    await open(page, "/components/stepper/")
    const vertical = page.locator("main ol[data-orientation=vertical]")
    await expect(vertical.locator("> li").first()).toHaveAttribute("aria-current", "step")
    await page.getByRole("button", { name: "Next step" }).click()
    await expect(vertical.locator("> li").nth(1)).toHaveAttribute("aria-current", "step")
    await expect(vertical.locator("> li").first()).toContainText("completed")
    await expect(vertical.locator("[data-connector-fill]").first()).toHaveAttribute("data-filled", "")
  })
})
