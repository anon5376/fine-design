// Server side, at build time (the page is a static export): the three presets' complete token sets, scoped to a subtree.
//
// Presets switch fully only at :root, and styles/presets.css scopes just the colors. The film shows three presets at once,
// so it takes styles/presets/<name>.css (the registry theme item: every token, unscoped) and rewrites its selectors:
//   :root   -> [data-film-preset="x"]                              palette, fonts, weights, radii, type scale, control sizes, padding, border width, shadows
//   .light  -> [data-film-preset="x"][data-film-scheme="light"]    the semantic colors (and the scheme's shadow color)
//   .dark   -> [data-film-preset="x"][data-film-scheme="dark"]
// The OS-dark media query is dropped: a scope always carries an explicit scheme. Every token is set on the scope element
// itself, so nothing is inherited from <html> (a stored data-preset or .dark there cannot reach in), and the scope has
// no .light/.dark class for the docs' own rules to match. Ledger gets a scope like the others.
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { PRESET_IDS, type PresetId } from "./presets"

/** The top-level rules of a stylesheet, comments removed. A rule's body is the text between its outer braces. */
function rules(css: string): { selector: string; body: string }[] {
  const src = css.replace(/\/\*[\s\S]*?\*\//g, "")
  const found: { selector: string; body: string }[] = []
  let depth = 0
  let start = 0
  let selector = ""
  for (let i = 0; i < src.length; i++) {
    if (src[i] === "{" && depth++ === 0) {
      selector = src.slice(start, i).trim()
      start = i + 1
    } else if (src[i] === "}" && --depth === 0) {
      found.push({ selector, body: src.slice(start, i) })
      start = i + 1
    }
  }
  return found
}

function scopeCss(preset: PresetId): string {
  const file = join(process.cwd(), "styles", "presets", `${preset}.css`)
  const at = (scheme?: string) => `[data-film-preset="${preset}"]${scheme ? `[data-film-scheme="${scheme}"]` : ""}`
  return rules(readFileSync(file, "utf8"))
    .flatMap(({ selector, body }) => {
      if (selector === ":root") return [`${at()} {${body}}`]
      if (selector === ".light") return [`${at("light")} {${body}}`]
      if (selector === ".dark") return [`${at("dark")} {${body}}`]
      if (selector.startsWith("@media (prefers-color-scheme: dark)")) return []
      // A new kind of rule in the generated theme must be scoped on purpose, not dropped or leaked.
      throw new Error(`film03 preset scope: unexpected "${selector}" in ${file}`)
    })
    .join("\n")
}

/** One <style> body for all three presets, light and dark. Render it once, anywhere above the stage. */
export function presetScopeCss(): string {
  return PRESET_IDS.map(scopeCss).join("\n")
}

const CONTRACT_FONTS = new Set(["--font-sans", "--font-mono", "--font-display", "--font-figure"])

/**
 * The next/font CSS variables the three presets read beyond the four contract ones (--font-geist-sans, --font-newsreader, ...),
 * taken from the font stacks in styles/tokens.json the way scripts/registry.mjs does. The film waits for each of them.
 */
export function presetFontVariables(): string[] {
  const tokens = JSON.parse(readFileSync(join(process.cwd(), "styles", "tokens.json"), "utf8")) as { presets: Record<string, { fonts: Record<string, string> }> }
  const found = new Set<string>()
  for (const id of PRESET_IDS) {
    for (const stack of Object.values(tokens.presets[id].fonts)) {
      for (const [, name] of stack.matchAll(/var\((--font-[\w-]+),/g)) if (!CONTRACT_FONTS.has(name)) found.add(name)
    }
  }
  return [...found]
}
