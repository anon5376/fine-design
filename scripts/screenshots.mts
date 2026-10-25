// Screenshots from the static export (npm run build first).
//   node scripts/screenshots.mts          every docs page at 375 and 1440, light and dark → screenshots/<width>-<scheme>/
//   node scripts/screenshots.mts states   overlays and menus in their open state → screenshots/states/
import { spawn } from "node:child_process"
import { mkdirSync, readdirSync } from "node:fs"
import { chromium, type Page } from "@playwright/test"

const port = 4339
const base = `http://localhost:${port}`
const server = spawn("node", ["scripts/serve.mjs"], { env: { ...process.env, PORT: String(port) }, stdio: "ignore" })
await new Promise(r => setTimeout(r, 500))

const browser = await chromium.launch({ channel: "chrome" })
const open = async (page: Page, path: string) => {
  await page.goto(base + path)
  await page.locator("html[data-hydrated]").waitFor({ state: "attached" })
}

type State = { name: string; path: string; scheme: "light" | "dark"; width?: number; act: (page: Page) => Promise<void> }
const states: State[] = [
  { name: "dialog", path: "/components/dialog/", scheme: "light", act: p => p.getByRole("button", { name: "Rename wallet" }).click() },
  {
    name: "menu",
    path: "/components/dropdown-menu/",
    scheme: "dark",
    act: async p => {
      await p.getByRole("button", { name: "Invoice actions" }).click()
      await p.getByRole("menuitem", { name: "Move to" }).hover()
      await p.waitForTimeout(250)
      await p.getByRole("menuitem", { name: "Sent" }).hover()
    },
  },
  {
    name: "command-palette",
    path: "/components/command-palette/",
    scheme: "dark",
    act: async p => {
      await p.keyboard.press("ControlOrMeta+k")
      await p.keyboard.type("n")
    },
  },
  { name: "drawer", path: "/components/drawer/", scheme: "light", act: p => p.getByRole("button", { name: "Filters" }).click() },
  {
    name: "toast",
    path: "/components/toast/",
    scheme: "light",
    act: async p => {
      await p.getByRole("button", { name: "Success" }).click()
      await p.getByRole("button", { name: "Archive invoice" }).click()
      await p.getByRole("button", { name: "Error" }).click()
    },
  },
  { name: "select", path: "/components/select/", scheme: "light", act: p => p.getByRole("combobox", { name: "Network" }).first().click() },
  { name: "table", path: "/components/table/", scheme: "dark", act: async () => {} },
  { name: "alert", path: "/components/alert/", scheme: "light", act: async () => {} },
  { name: "tabs", path: "/components/tabs/", scheme: "light", act: p => p.getByRole("tablist").first().getByRole("tab", { name: "Transfers" }).click() },
  { name: "accordion", path: "/components/accordion/", scheme: "dark", act: p => p.getByRole("button", { name: "How long do transfers take?" }).first().click() },
  { name: "navbar-mobile", path: "/components/navbar/", scheme: "light", width: 375, act: p => p.getByRole("button", { name: "Open menu" }).click() },
  { name: "dashboard-shell", path: "/blocks/dashboard-shell/", scheme: "dark", act: async () => {} },
]

try {
  if (process.argv[2] === "states") {
    mkdirSync("screenshots/states", { recursive: true })
    for (const s of states) {
      const page = await browser.newPage({ viewport: { width: s.width ?? 1440, height: 900 }, colorScheme: s.scheme })
      await open(page, s.path)
      await s.act(page)
      await page.waitForTimeout(500)
      await page.screenshot({ path: `screenshots/states/${s.name}-${s.scheme}.png` })
      await page.close()
    }
  } else {
    const paths = ["/", "/tokens/", ...["components", "blocks"].flatMap(d => readdirSync(`out/${d}`).map(slug => `/${d}/${slug}/`))]
    for (const width of [375, 1440])
      for (const scheme of ["light", "dark"] as const) {
        const dir = `screenshots/${width}-${scheme}`
        mkdirSync(dir, { recursive: true })
        const page = await browser.newPage({ viewport: { width, height: 900 }, colorScheme: scheme })
        for (const path of paths) {
          await open(page, path)
          await page.screenshot({ path: `${dir}/${path.replace(/^\/|\/$/g, "").replace(/\//g, "--") || "index"}.png`, fullPage: true })
        }
        await page.close()
      }
  }
} finally {
  await browser.close()
  server.kill()
}
console.log("done")
