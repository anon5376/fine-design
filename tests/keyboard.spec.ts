import { expect, test, type Page } from "@playwright/test"

async function open(page: Page, path: string) {
  await page.goto(path)
  await page.locator("html[data-hydrated]").waitFor({ state: "attached" })
}

test("dialog traps focus, closes on Escape, returns focus", async ({ page }) => {
  await open(page, "/components/dialog/")
  const trigger = page.getByRole("button", { name: "Rename wallet" })
  await trigger.focus()
  await page.keyboard.press("Enter")
  const dialog = page.getByRole("dialog", { name: "Rename wallet" })
  await expect(dialog).toBeVisible()
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press("Tab")
    await page.waitForTimeout(50) // Base UI hands focus back from its guard on the next frame
    expect(await dialog.evaluate(d => d.contains(document.activeElement))).toBe(true)
  }
  await page.keyboard.press("Escape")
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()
})

test("menu: arrows move focus, highlight sits on the focused item, Escape returns focus", async ({ page }) => {
  await open(page, "/components/dropdown-menu/")
  const trigger = page.getByRole("button", { name: "Invoice actions" })
  await trigger.focus()
  await page.keyboard.press("ArrowDown")
  const menu = page.getByRole("menu")
  await expect(menu).toBeVisible()
  await page.keyboard.press("ArrowDown")
  const focused = page.getByRole("menuitem", { name: /Duplicate/ })
  await expect(focused).toBeFocused()
  await page.waitForTimeout(300)
  const [item, highlight] = await Promise.all([
    focused.boundingBox(),
    menu.locator(":scope > span[aria-hidden]").boundingBox(),
  ])
  expect(Math.abs(item!.y - highlight!.y)).toBeLessThan(1)
  expect(Math.abs(item!.height - highlight!.height)).toBeLessThan(1)
  await page.keyboard.press("Escape")
  await expect(menu).toBeHidden()
  await expect(trigger).toBeFocused()
})

test("combobox: label focuses input, typing filters, Enter selects", async ({ page }) => {
  await open(page, "/components/combobox/")
  await page.getByText("Token", { exact: true }).click()
  const input = page.getByRole("combobox", { name: "Token" })
  await expect(input).toBeFocused()
  await page.keyboard.type("u")
  await expect(page.getByRole("option")).toHaveText(["USD Coin", "Uniswap"])
  await page.keyboard.press("ArrowDown")
  await page.keyboard.press("ArrowDown")
  await page.keyboard.press("Enter")
  await expect(input).toHaveValue("Uniswap")
})

test("select: keyboard picks a value", async ({ page }) => {
  await open(page, "/components/select/")
  const trigger = page.getByRole("combobox", { name: "Network" }).first()
  await trigger.focus()
  await page.keyboard.press("Enter")
  await expect(page.getByRole("listbox")).toBeVisible()
  await page.keyboard.press("ArrowDown")
  await page.keyboard.press("Enter")
  await expect(trigger).toHaveText("Arbitrum")
})

test("command palette: Meta+K opens, search filters, Enter runs the command", async ({ page }) => {
  await open(page, "/components/command-palette/")
  await page.keyboard.press("ControlOrMeta+k")
  const input = page.getByRole("combobox", { name: "Search commands" })
  await expect(input).toBeFocused()
  await page.keyboard.type("sett")
  await expect(page.getByRole("option")).toHaveText(["Settings⌘,"])
  await page.keyboard.press("Enter")
  await expect(page.getByRole("dialog", { name: "Command palette" })).toBeHidden()
  await expect(page.getByRole("dialog", { name: "Settings" })).toBeVisible()
})

test("drawer opens from the trigger and closes on Escape", async ({ page }) => {
  await open(page, "/components/drawer/")
  await page.getByRole("button", { name: "Filters" }).click()
  const drawer = page.getByRole("dialog", { name: "Filters" })
  await expect(drawer).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(drawer).toBeHidden()
})

test("toast appears with its title and can be dismissed", async ({ page }) => {
  await open(page, "/components/toast/")
  await page.getByRole("button", { name: "Success" }).click()
  const toast = page.getByRole("dialog", { name: "Transfer sent" })
  await expect(toast).toBeVisible()
  await toast.hover() // Base UI exposes Close to assistive tech once the stack expands
  await page.getByRole("button", { name: "Dismiss" }).click()
  await expect(toast).toBeHidden()
})

test("tabs: arrows, Home and End move focus and select, the matching panel shows", async ({ page }) => {
  await open(page, "/components/tabs/")
  const list = page.getByRole("tablist").first()
  const tab = (name: string) => list.getByRole("tab", { name })
  const panels = list.locator("xpath=..").getByRole("tabpanel")
  await expect(tab("Balances")).toHaveAttribute("aria-selected", "true")
  await tab("Balances").focus()
  const steps = [
    { key: "ArrowRight", name: "Transfers", text: "Northwind Ltd" },
    { key: "End", name: "Statements", text: "September 2026" },
    { key: "ArrowLeft", name: "Transfers", text: "Northwind Ltd" },
    { key: "Home", name: "Balances", text: "Operating" },
  ]
  for (const s of steps) {
    await page.keyboard.press(s.key)
    await expect(tab(s.name)).toBeFocused()
    await expect(tab(s.name)).toHaveAttribute("aria-selected", "true")
    await expect(panels).toHaveCount(1)
    await expect(panels).toContainText(s.text)
  }
})

test("accordion: Tab reaches a trigger, Enter and Space toggle it", async ({ page }) => {
  await open(page, "/components/accordion/")
  const trigger = page.getByRole("button", { name: "How long do transfers take?" }).first()
  for (let i = 0; i < 120 && !(await trigger.evaluate(el => el === document.activeElement)); i++) await page.keyboard.press("Tab")
  await expect(trigger).toBeFocused()
  await expect(trigger).toHaveAttribute("aria-expanded", "false")
  await page.keyboard.press("Enter")
  await expect(trigger).toHaveAttribute("aria-expanded", "true")
  const panel = page.locator(`[id="${await trigger.getAttribute("aria-controls")}"]`)
  await expect(panel).toBeVisible()
  await expect(panel).toContainText("Domestic transfers settle within one business day")
  await page.keyboard.press("Space")
  await expect(trigger).toHaveAttribute("aria-expanded", "false")
  await expect(panel).toBeHidden()
})

test("pagination: activating a page from the keyboard marks it current", async ({ page }) => {
  await open(page, "/components/pagination/")
  const nav = page.getByRole("navigation", { name: "Pagination" }).nth(2) // FirstPage: starts on page 1
  const one = nav.getByRole("button", { name: "Page 1" })
  const two = nav.getByRole("button", { name: "Page 2" })
  await expect(one).toHaveAttribute("aria-current", "page")
  await two.focus()
  await page.keyboard.press("Enter")
  await expect(two).toHaveAttribute("aria-current", "page")
  await expect(one).not.toHaveAttribute("aria-current", "page")
})

test("navbar at 375px: Open menu opens the drawer with the links, Escape closes and returns focus", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 })
  await open(page, "/components/navbar/")
  const trigger = page.getByRole("button", { name: "Open menu" })
  await trigger.focus()
  await page.keyboard.press("Enter")
  const drawer = page.getByRole("dialog", { name: "Menu" })
  await expect(drawer).toBeVisible()
  await expect(drawer.getByRole("link")).toHaveText(["Overview", "Transfers", "Invoices", "Wallets"])
  await page.keyboard.press("Escape")
  await expect(drawer).toBeHidden()
  await expect(trigger).toBeFocused()
})
