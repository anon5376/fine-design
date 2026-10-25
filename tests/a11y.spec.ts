import { readdirSync } from "node:fs"
import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"

const tags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"]

async function open(page: Page, path: string) {
  await page.goto(path)
  await page.locator("html[data-hydrated]").waitFor({ state: "attached" })
}

// Narrow, deliberate exceptions: a rule plus the elements it may flag. Everything else must be clean.
const allowed: { rule: string; selector: string; why: string }[] = [
  // Docs examples show several instances of one component on a page; a real page has one.
  { rule: "landmark-unique", selector: 'section[aria-labelledby^="example-"] nav', why: "repeated demo instances" },
  // A block page shows the default footer and a customised one.
  { rule: "landmark-unique", selector: "article footer nav", why: "repeated demo instances" },
  // Popups are portaled to the end of <body>, outside the page landmarks; their roles and focus handling announce them.
  { rule: "region", selector: "[data-base-ui-portal]", why: "portaled popups" },
  // The dashboard-shell block is a whole app (with its own <main>) shown inside the docs page's <main>.
  { rule: "landmark-main-is-top-level", selector: "#main main", why: "app embedded in docs" },
  { rule: "landmark-no-duplicate-main", selector: "main", why: "app embedded in docs" },
  { rule: "landmark-unique", selector: "#main:has(main)", why: "app embedded in docs" },
]

async function scan(page: Page) {
  await page.waitForTimeout(500) // let enter transitions finish so contrast is read at full opacity
  const { violations } = await new AxeBuilder({ page }).withTags(tags).analyze()
  const found: { rule: string; node: string }[] = []
  for (const v of violations)
    for (const n of v.nodes) {
      const selectors = allowed.filter(a => a.rule === v.id).map(a => a.selector)
      const ok = selectors.length > 0 && (await page.locator(n.target.join(" >> ")).first().evaluate((el, sel) => sel.some(s => el.closest(s)), selectors))
      if (!ok) found.push({ rule: v.id, node: n.target.join(" ") })
    }
  expect(found).toEqual([])
}

const paths = ["/", "/tokens/", "/showcase/", ...["components", "blocks"].flatMap(d => readdirSync(`out/${d}`).map(slug => `/${d}/${slug}/`))]

for (const scheme of ["light", "dark"] as const) {
  test.describe(scheme, () => {
    test.use({ colorScheme: scheme })

    for (const path of paths)
      test(`page ${path}`, async ({ page }) => {
        await open(page, path)
        await scan(page)
      })

    test("select open", async ({ page }) => {
      await open(page, "/components/select/")
      await page.getByRole("combobox", { name: "Network" }).first().click()
      await expect(page.getByRole("listbox")).toBeVisible()
      await scan(page)
    })

    test("dropdown menu and submenu open", async ({ page }) => {
      await open(page, "/components/dropdown-menu/")
      await page.getByRole("button", { name: "Invoice actions" }).click()
      await page.getByRole("menuitem", { name: "Move to" }).hover()
      await expect(page.getByRole("menuitem", { name: "Sent" })).toBeVisible()
      await scan(page)
    })

    test("dialog open", async ({ page }) => {
      await open(page, "/components/dialog/")
      await page.getByRole("button", { name: "Rename wallet" }).click()
      await expect(page.getByRole("dialog", { name: "Rename wallet" })).toBeVisible()
      await scan(page)
    })

    test("drawer open", async ({ page }) => {
      await open(page, "/components/drawer/")
      await page.getByRole("button", { name: "Filters" }).click()
      await expect(page.getByRole("dialog")).toBeVisible()
      await scan(page)
    })

    test("command palette open", async ({ page }) => {
      await open(page, "/components/command-palette/")
      await page.keyboard.press("ControlOrMeta+k")
      await page.keyboard.type("n")
      await expect(page.getByRole("dialog")).toBeVisible()
      await scan(page)
    })

    test("tooltip shown", async ({ page }) => {
      await open(page, "/components/tooltip/")
      await page.getByRole("button", { name: "Bold" }).hover()
      await expect(page.locator("[class*='z-(--z-tooltip)']")).toBeVisible()
      await scan(page)
    })

    test("toast shown", async ({ page }) => {
      await open(page, "/components/toast/")
      await page.getByRole("button", { name: "Success" }).click()
      await page.getByRole("button", { name: "Error" }).click()
      await expect(page.locator("[data-toast], [role=status], [role=alert]").first()).toBeVisible()
      await scan(page)
    })

    test("navbar drawer at 375px", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 })
      await open(page, "/components/navbar/")
      await page.getByRole("button", { name: "Open menu" }).click()
      await expect(page.getByRole("dialog")).toBeVisible()
      await scan(page)
    })
  })
}

// The same scans under each non-default preset. Ledger is covered above; the preset is applied the way a visitor's choice is,
// through localStorage before the page loads.
const presetPaths = ["/", "/components/field/", "/components/button/", "/blocks/hero/", "/blocks/pricing/"]

for (const preset of ["folio", "poster"]) {
  for (const scheme of ["light", "dark"] as const) {
    test.describe(`${preset} ${scheme}`, () => {
      test.use({ colorScheme: scheme })
      test.beforeEach(async ({ page }) => {
        await page.addInitScript(id => localStorage.setItem("preset", id), preset)
      })

      for (const path of presetPaths)
        test(`page ${path}`, async ({ page }) => {
          await open(page, path)
          await expect(page.locator("html")).toHaveAttribute("data-preset", preset)
          await scan(page)
        })

      test("select open", async ({ page }) => {
        await open(page, "/components/select/")
        await page.getByRole("combobox", { name: "Network" }).first().click()
        await expect(page.getByRole("listbox")).toBeVisible()
        await scan(page)
      })

      test("dialog open", async ({ page }) => {
        await open(page, "/components/dialog/")
        await page.getByRole("button", { name: "Rename wallet" }).click()
        await expect(page.getByRole("dialog", { name: "Rename wallet" })).toBeVisible()
        await scan(page)
      })
    })
  }
}
