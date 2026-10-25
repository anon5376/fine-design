import { expect, test, type Page } from "@playwright/test"

// A figure (money, counts, IDs) stays inside its box under every preset and at every width. Poster's Martian Mono is wide
// and its figures are large, so a fixed text size pushed stat figures out of their cards; figure-fit sizes them by the card.

const presets = ["ledger", "folio", "poster"]
const pages = ["/showcase/", "/blocks/dashboard-shell/"]
// Every 8px, because the overflow sits at layout cliffs (a column or the sidebar appearing), not at round widths.
// 768, 1024, 1280, 1440 and 1680 (where the dashboard-shell block's four-up row first fits its docs frame) are all on the grid.
const widths = Array.from({ length: (1800 - 640) / 8 + 1 }, (_, i) => 640 + i * 8)

// The preset is applied the way a visitor's choice is, through localStorage before the page loads.
async function open(page: Page, path: string, preset: string) {
  await page.addInitScript(id => localStorage.setItem("preset", id), preset)
  await page.goto(path)
  await page.locator("html[data-hydrated]").waitFor({ state: "attached" })
  await page.evaluate(() => document.fonts.ready) // a preset's faces load on first use; fallback metrics would hide an overflow
}

/** Figures that stick out of the box they sit in: the card, or the nearest ancestor that clips. A scroller (a Table) is reachable, so it is not a box. */
function overflowing() {
  const found: string[] = []
  for (const el of document.querySelectorAll<HTMLElement>(".figures")) {
    const rect = el.getBoundingClientRect()
    if (!rect.width) continue
    const label = `"${(el.querySelector(".sr-only") ?? el).textContent?.trim().slice(0, 24)}" ${getComputedStyle(el).fontSize}`
    if (el.scrollWidth > el.clientWidth + 0.5) found.push(`${label}: scrollWidth ${el.scrollWidth} > clientWidth ${el.clientWidth}`)

    let box: Element | null = el.parentElement
    while (box && !box.matches(".rounded-container") && getComputedStyle(box).overflowX === "visible") box = box.parentElement
    if (box && /auto|scroll/.test(getComputedStyle(box).overflowX)) continue
    const edge = (box ?? document.documentElement).getBoundingClientRect()
    const style = box ? getComputedStyle(box) : null
    // Inside the padding, not just inside the border: a figure that touches a card's outline is already out of place.
    const inset = (side: "Left" | "Right") => (style ? parseFloat(style[`border${side}Width`]) + parseFloat(style[`padding${side}`]) : 0)
    const [left, right] = [edge.left + inset("Left"), edge.right - inset("Right")]
    if (rect.left < left - 0.5 || rect.right > right + 0.5) found.push(`${label}: ${Math.round(rect.left)}..${Math.round(rect.right)} outside ${Math.round(left)}..${Math.round(right)}`)
  }
  return found
}

for (const preset of presets) {
  test.describe(preset, () => {
    for (const path of pages)
      test(`figures fit on ${path} from ${widths[0]} to ${widths[widths.length - 1]}px`, async ({ page }) => {
        await open(page, path, preset)
        const found: Record<number, string> = {}
        for (const width of widths) {
          await page.setViewportSize({ width, height: 900 })
          const [first, ...more] = await page.evaluate(overflowing)
          if (first) found[width] = more.length ? `${first} (+${more.length} more)` : first
        }
        expect(found).toEqual({})
      })

    // figure-fit trusts the preset's number, so it has to cover the face the preset actually loads, for digits and money glyphs.
    test("figureAdvance covers the figure face", async ({ page }) => {
      await open(page, "/", preset)
      const { declared, measured, loaded } = await page.evaluate(async () => {
        const probe = document.createElement("span")
        probe.className = "figures"
        probe.style.cssText = "position:absolute;visibility:hidden;white-space:pre;font-size:100px"
        document.body.append(probe)
        const glyphs = [..."0123456789$,.+−"]
        const font = `100px ${getComputedStyle(probe).fontFamily}`
        await document.fonts.load(font, glyphs.join(""))
        const widths = glyphs.map(g => ((probe.textContent = g), probe.getBoundingClientRect().width / 100))
        probe.remove()
        return {
          declared: parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--figure-advance")),
          measured: Math.max(...widths),
          loaded: document.fonts.check(font),
        }
      })
      expect(loaded).toBe(true)
      expect(measured).toBeLessThanOrEqual(declared + 0.001)
    })
  })
}
