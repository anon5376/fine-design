// Generates registry.json (shadcn registry schema) and public/llms.txt from the source, so neither drifts.
// `shadcn build` then turns registry.json into public/r/<name>.json (npm run registry:build).
// REGISTRY_URL is the origin the docs are served from; it is baked into registryDependencies and links.
import { readdirSync, readFileSync, writeFileSync } from "node:fs"
import postcss from "postcss"
import { blocks as navBlocks, components as navComponents } from "../site/nav.ts"

const ORIGIN = (process.env.REGISTRY_URL ?? "http://localhost:4319").replace(/\/$/, "")
const read = path => readFileSync(new URL(`../${path}`, import.meta.url), "utf8")
const pkg = JSON.parse(read("package.json"))

const BASE = "fine-base"
const ALIAS = "fine-theme"
const registryUrl = name => `${ORIGIN}/r/${name}.json`

// Per item: category and a one-line description. A file without an entry fails the build, so none is forgotten.
const CATEGORIES = ["base", "foundations", "inputs", "display", "feedback", "overlays", "navigation", "blocks", "lib", "theme"]
const UI = {
  text: ["foundations", "Body text with size and tone variants."],
  heading: ["foundations", "Section heading: level sets the tag, size sets the look."],
  icon: ["foundations", "Sizes an icon on the scale and sets the 1.5 stroke."],
  layout: ["foundations", "Stack, Grid and Container for one-axis, grid and page-width layout."],
  separator: ["foundations", "Horizontal or vertical divider."],
  "visually-hidden": ["foundations", "Hides content visually and keeps it for screen readers."],
  button: ["inputs", "Primary, secondary, outline, ghost and danger buttons with a loading state."],
  "icon-button": ["inputs", "Square icon button with a required accessible label."],
  input: ["inputs", "Text input in three sizes."],
  textarea: ["inputs", "Multi-line text input."],
  select: ["inputs", "Single-choice dropdown with a gliding hover highlight."],
  combobox: ["inputs", "Searchable single-choice input with a filtered list."],
  checkbox: ["inputs", "Checkbox with an indeterminate state."],
  radio: ["inputs", "Radio group with radio buttons."],
  switch: ["inputs", "On and off toggle."],
  slider: ["inputs", "Value slider for one thumb or a range."],
  label: ["inputs", "Form label."],
  field: ["inputs", "Form, Field, label, hint and error wired to Base UI validation."],
  card: ["display", "Surface with header, title, content and footer."],
  badge: ["display", "Compact status label in neutral and status tones."],
  avatar: ["display", "User image with an initials fallback."],
  tag: ["display", "Chip for a chosen value or filter, with an optional remove button."],
  kbd: ["display", "Keyboard key hint."],
  "animated-number": ["display", "Figure whose changed digits roll to the new value, in the direction it moved."],
  table: ["display", "Table with header, body, row and cell styling."],
  accordion: ["display", "Collapsible sections, one or several open at a time."],
  skeleton: ["feedback", "Pulsing placeholder for content that is loading."],
  progress: ["feedback", "Determinate and indeterminate progress bar."],
  "empty-state": ["feedback", "Placeholder for an empty list or screen, with an action."],
  alert: ["feedback", "Inline message in neutral and status tones."],
  toast: ["feedback", "Stacked notifications that rise in on the expressive tier; mount Toaster once."],
  tooltip: ["overlays", "Short label on hover and focus; TooltipProvider groups a toolbar."],
  dialog: ["overlays", "Centered modal on the slow motion tier."],
  drawer: ["overlays", "Side sheet that slides in from an edge and follows a swipe."],
  popover: ["overlays", "Floating panel anchored to its trigger."],
  "dropdown-menu": ["overlays", "Action menu with a gliding hover highlight."],
  "command-palette": ["overlays", "Searchable command list in a dialog."],
  tabs: ["navigation", "Tabbed panels with a gliding indicator."],
  breadcrumb: ["navigation", "Path trail with links, separators, an ellipsis and the current page."],
  pagination: ["navigation", "Page links with a sliding active indicator."],
  navbar: ["navigation", "Sticky site header whose links fold into a drawer on small screens."],
  sidebar: ["navigation", "Vertical navigation with groups of link rows and a gliding hover highlight."],
}
const BLOCKS = {
  "auth-form": "Sign-in form with validation, an onSubmit handler, and slots for title, submit label and footer.",
  hero: "Headline, description, actions and a media slot; the default media is a stack of ledger slips that settles in.",
  "feature-grid": "Heading and a grid of icon features; both come from props, six by default.",
  pricing: "Plans with a monthly and yearly toggle, one recommended; plans, labels, currency and billing come from props.",
  faq: "Accordion of questions from props; the first answer is open by default.",
  footer: "Footer with a brand, link columns and a legal line from props; four columns by default.",
  "dashboard-shell": "App frame with sidebar, header and a content slot; nav, breadcrumb, account and page title come from props. Fills its container; the default content is a paged transfers table.",
}
const LIB = {
  utils: "cn: clsx plus tailwind-merge.",
  popup: "Shared surface, motion and row classes for floating popups.",
  "fluid-hover": "useFluidHover and FluidHighlight: one hover highlight that glides between list items.",
  motion: "Spring tiers and easing curves for Motion, generated from the tokens.",
}

// ---------------------------------------------------------------- source parsing

const files = dir => readdirSync(new URL(`../${dir}`, import.meta.url)).filter(f => /\.tsx?$/.test(f)).sort()
const slugOf = file => file.replace(/\.tsx?$/, "")

// Blanks string literals and comments (keeping length) so braces inside them are not counted.
function blank(src) {
  let out = ""
  for (let i = 0; i < src.length; ) {
    const c = src[i]
    if (c === "/" && src[i + 1] === "/") {
      const end = src.indexOf("\n", i)
      const stop = end < 0 ? src.length : end
      out += " ".repeat(stop - i)
      i = stop
    } else if (c === "/" && src[i + 1] === "*") {
      const stop = src.indexOf("*/", i) + 2
      out += src.slice(i, stop).replace(/[^\n]/g, " ")
      i = stop
    } else if (c === '"' || c === "'" || c === "`") {
      let j = i + 1
      while (j < src.length && src[j] !== c) j += src[j] === "\\" ? 2 : 1
      out += c + " ".repeat(j - i - 1) + c
      i = j + 1
    } else {
      out += c
      i++
    }
  }
  return out
}

function closing(code, open) {
  const pairs = { "{": "}", "[": "]", "(": ")" }
  let depth = 0
  for (let i = open; i < code.length; i++) {
    if ("{[(".includes(code[i])) depth++
    else if ("}])".includes(code[i]) && --depth === 0) return i
  }
  throw new Error(`unbalanced ${pairs[code[open]]}`)
}

// Top-level keys of the object literal src[open..close]; a shorthand key resolves through `const key = { ... }`.
function objectKeys(src, code, open, close) {
  const keys = []
  let depth = 0
  let expectKey = false
  for (let i = open; i <= close; i++) {
    const c = code[i]
    if ("{[(".includes(c)) {
      depth++
      expectKey = depth === 1 && c === "{"
    } else if ("}])".includes(c)) {
      depth--
    } else if (depth === 1 && c === ",") {
      expectKey = true
    } else if (depth === 1 && expectKey && !/\s/.test(c)) {
      expectKey = false
      const m = /^(?:"([^"]*)"|([\w$]+))\s*(:|,|\})/.exec(src.slice(i, close + 1))
      if (!m) continue
      const key = m[1] ?? m[2]
      let value = null
      if (m[3] === ":") {
        const rest = /^\s*\{/.exec(code.slice(i + m[0].length))
        if (rest) {
          const brace = i + m[0].length + rest[0].length - 1
          value = [brace, closing(code, brace)]
        }
      } else {
        const decl = new RegExp(`const ${key} = \\{`).exec(code)
        if (decl) value = [decl.index + decl[0].length - 1, closing(code, decl.index + decl[0].length - 1)]
      }
      keys.push([key, value])
      i += m[0].length - 1
      if (m[3] === ",") expectKey = true
    }
  }
  return keys
}

// { buttonVariants: { variant: [...], size: [...] } } for each exported cva() in the file.
function variantsOf(src, exported) {
  const code = blank(src)
  const out = {}
  for (const m of src.matchAll(/const (\w+Variants) = cva\(/g)) {
    if (!exported.includes(m[1])) continue
    const start = m.index + m[0].length - 1
    const call = code.slice(start, closing(code, start) + 1)
    const v = /variants:\s*\{/.exec(call)
    if (!v) continue
    const open = start + v.index + v[0].length - 1
    const groups = {}
    for (const [group, span] of objectKeys(src, code, open, closing(code, open))) {
      if (span) groups[group] = objectKeys(src, code, span[0], span[1]).map(([k]) => k)
    }
    out[m[1]] = groups
  }
  return out
}

function exportsOf(src) {
  const names = []
  for (const m of src.matchAll(/^export\s*\{([^}]*)\}/gm)) names.push(...m[1].split(",").map(s => s.trim().split(/\s+as\s+/).pop()).filter(Boolean))
  for (const m of src.matchAll(/^export (?:async )?(?:function|const) (\w+)/gm)) names.push(m[1])
  return names
}

// Absolute registry URLs for local imports, bare npm imports pinned to package.json.
function importsOf(src, self) {
  const registryDependencies = new Set()
  const dependencies = new Set()
  for (const m of src.matchAll(/(?:import|export)\s[^"'`]*?from\s*["']([^"']+)["']|import\s*["']([^"']+)["']/g)) {
    const spec = m[1] ?? m[2]
    const local = /^@\/(components\/ui|lib)\/([\w-]+)$/.exec(spec)
    if (local) {
      const name = local[2]
      if (name === self) continue
      if (local[1] === "lib" ? !(name in LIB) : !(name in UI)) throw new Error(`${self}: unknown import ${spec}`)
      registryDependencies.add(registryUrl(name))
    } else if (spec.startsWith("@/") || spec.startsWith(".")) {
      throw new Error(`${self}: import ${spec} is not in the registry`)
    } else {
      const name = spec.startsWith("@") ? spec.split("/").slice(0, 2).join("/") : spec.split("/")[0]
      if (name === "react" || name === "react-dom") continue
      const version = pkg.dependencies[name]
      if (!version) throw new Error(`${self}: ${name} is not in package.json dependencies`)
      dependencies.add(`${name}@${version}`)
    }
  }
  return { registryDependencies: [...registryDependencies].sort(), dependencies: [...dependencies].sort() }
}

function sourceItem({ name, type, path, title, description, category, docs }) {
  const src = read(path)
  const { registryDependencies, dependencies } = importsOf(src, name)
  const exported = exportsOf(src)
  const variants = variantsOf(src, exported)
  return {
    name,
    type,
    title,
    description,
    ...(dependencies.length && { dependencies }),
    registryDependencies: [registryUrl(BASE), ...registryDependencies],
    files: [{ path, type }],
    categories: [category],
    ...(docs && { docs }),
    meta: { exports: exported.filter(e => /^[A-Za-z]/.test(e)), ...(Object.keys(variants).length && { variants }), ...(/^"use client"/.test(src) && { client: true }) },
  }
}

// ---------------------------------------------------------------- items

const titles = Object.fromEntries([...navComponents, ...navBlocks].map(e => [e.slug, e.title]))
const items = []

const uiFiles = files("components/ui").map(slugOf)
const blockFiles = files("components/blocks").map(slugOf)
const libFiles = files("lib")
const coverage = (what, have, want) => {
  const missing = [...have].filter(n => !want.includes(n))
  const extra = want.filter(n => !have.includes(n))
  if (missing.length || extra.length) throw new Error(`${what}: no entry for [${missing}], entry without a file [${extra}]`)
}
coverage("components/ui", uiFiles, Object.keys(UI))
coverage("components/blocks", blockFiles, Object.keys(BLOCKS))
coverage("lib", libFiles.map(slugOf), Object.keys(LIB))
coverage("site/nav.ts components", uiFiles, navComponents.map(e => e.slug))
coverage("site/nav.ts blocks", blockFiles, navBlocks.map(e => e.slug))

for (const [slug, [category, description]] of Object.entries(UI)) {
  items.push(sourceItem({
    name: slug, type: "registry:ui", path: `components/ui/${slug}.tsx`, title: titles[slug],
    description, category, docs: `${ORIGIN}/components/${slug}/`,
  }))
}
for (const [slug, description] of Object.entries(BLOCKS)) {
  items.push(sourceItem({
    name: slug, type: "registry:block", path: `components/blocks/${slug}.tsx`, title: titles[slug],
    description, category: "blocks", docs: `${ORIGIN}/blocks/${slug}/`,
  }))
}
for (const file of libFiles) {
  const slug = slugOf(file)
  items.push(sourceItem({
    name: slug, type: "registry:lib", path: `lib/${file}`, title: slug, description: LIB[slug], category: "lib",
  }))
}

// ---------------------------------------------------------------- fine-base and themes

// A look is split in two so installing a component never re-skins a project.
//   fine-base   the machinery: @theme inline mappings, utilities, base layer, keyframes, motion scalars. Every ui, block
//               and lib item depends on it. It also carries Ledger's value of every token, as defaults inside
//               `@layer base`, so any :root rule in the project and any installed theme beats it wherever it sits in the file.
//   theme-<n>   one preset's values and nothing else, on :root / .light / .dark / OS dark. Installed on purpose, once.
//   fine-theme  alias of theme-ledger, so old install lines keep working.
// styles/fine.css and styles/presets/<name>.css are generated (scripts/tokens.mjs); both items are cut from them here.
// What the shadcn CLI does with the result: `cssVars.theme` -> `@theme inline`; the `css` field, key by key: a plain
// selector merges into the first top-level rule with that exact selector (so a theme's `:root` lands in the project's own
// :root), an at-rule is found or created and its rules merged (so the defaults join the project's own `@layer base`). Kept out on purpose:
// `--color-*: initial` (the consumer's Tailwind palette stays), spacing and breakpoints (Tailwind's own values).
// `primitives` names the palette variables to inline: the preset's own ramps (its tokens.json primitives), so a preset can
// add one (plum, magenta) without this script knowing it.
function parseCss(path, primitives) {
  const root = postcss.parse(read(path))
  const prims = {}
  const theme = {}
  const css = {}
  const squash = s => s.replace(/\s+/g, " ").trim()
  const put = (target, key, value) => {
    if (value && typeof value === "object" && typeof target[key] === "object") for (const [k, v] of Object.entries(value)) put(target[key], k, v)
    else target[key] = value
  }
  const toObject = node => {
    const out = {}
    for (const n of node.nodes) {
      if (n.type === "decl") out[n.prop] = n.important ? `${n.value} !important` : n.value
      else if (n.type === "rule") put(out, squash(n.selector), toObject(n))
      else if (n.type === "atrule") put(out, squash(`@${n.name} ${n.params}`), n.nodes ? toObject(n) : {})
    }
    return out
  }

  for (const n of root.nodes) {
    if (n.type === "atrule" && n.name === "theme") {
      for (const d of n.nodes) {
        const key = d.prop.replace(/^--/, "")
        if (key === "color-*" || key === "spacing" || key.startsWith("breakpoint-")) continue
        theme[key] = d.value
      }
    } else if (n.type === "rule" && n.selector === ":root" && !Object.keys(prims).length) {
      for (const d of n.nodes) if (primitives.includes(d.prop.slice(2))) prims[d.prop.slice(2)] = d.value
      put(css, ":root", toObject(n))
    } else if (n.type === "rule" || n.type === "atrule") {
      const rest = toObject({ nodes: [n] })
      for (const [k, v] of Object.entries(rest)) put(css, k, v)
    }
  }

  // Palette primitives are inlined into the semantic tokens, so only semantic names land in the consumer's :root.
  const inline = value => value.replace(/var\(--([\w-]+)\)/g, (whole, name) => prims[name] ?? whole)
  const walk = (obj, fn) => {
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v === "string") obj[k] = fn(v)
      else walk(v, fn)
    }
  }
  for (const name of Object.keys(prims)) delete css[":root"][`--${name}`]
  walk(css, inline)
  // Theme values that point at another theme value are resolved here, so each is self-contained in `@theme inline`.
  for (const [key, value] of Object.entries(theme)) {
    theme[key] = value.replace(/var\(--([\w-]+)\)/g, (whole, name) => (name !== key && name in theme ? theme[name] : whole))
  }
  return { theme, css }
}

const tokens = JSON.parse(read("styles/tokens.json"))
const titleCase = s => s[0].toUpperCase() + s.slice(1)

// Ledger's values as defaults: the light, .light, .dark and OS-dark rules move into `@layer base`. Unlayered rules beat
// layered ones whatever their specificity or position, so the project's own :root and any installed theme win in every
// mode. Inside the layer the usual specificity picks the mode (`:root:not(.light)` over `:root`), and the rules are
// written in one block so their order cannot be broken by a theme's own @media block earlier in the file.
const DARK_OS = "@media (prefers-color-scheme: dark)"
function asDefaults(css) {
  const { ":root": light, ".light": lightScope, ".dark": darkScope, [DARK_OS]: dark, "@layer base": base, ...rest } = css
  return { ...rest, "@layer base": { ":root": light, ".light": lightScope, ".dark": darkScope, [DARK_OS]: dark, ...base } }
}

function baseItem() {
  const { theme, css } = parseCss("styles/fine.css", Object.keys(tokens.primitives))
  const colors = Object.keys(theme).filter(k => k.startsWith("color-")).map(k => k.slice(6))
  return {
    name: BASE,
    type: "registry:style",
    title: "Fine base",
    description: "The @theme inline mappings, the figures, focus-ring and border-line utilities, base layer, keyframes and motion scalars, with Ledger defaults for every token in a cascade layer, so your :root and any theme win.",
    cssVars: { theme },
    css: asDefaults(css),
    categories: ["base"],
    docs: `${ORIGIN}/tokens/`,
    meta: { colors, modes: ["light", "dark", "os"], motion: tokens.motion },
  }
}

// Fonts a preset reads beyond the four contract variables, from var(--font-x, "Family") in its font stacks, with the
// optional next/font `axes` or `weights` its fontOptions declare for that variable (needed to load the face as the docs do).
const FONT_VARS = new Set(["--font-sans", "--font-mono", "--font-display", "--font-figure"])
function fontsOf(preset, fonts, options = {}) {
  const found = new Map()
  for (const value of Object.values(fonts)) {
    for (const m of value.matchAll(/var\((--[\w-]+)(?:,\s*"([^"]+)")?\)/g)) {
      if (FONT_VARS.has(m[1])) continue
      if (!m[2]) throw new Error(`preset ${preset}: ${m[1]} needs a quoted fallback family, as var(${m[1]}, "Family")`)
      found.set(m[1], m[2])
    }
  }
  return [...found].map(([variable, family]) => ({ variable, family, ...options[variable] }))
}

// The docs load every preset's fonts in site/presets.ts; a font the tokens read but that file never declares would silently fall back,
// and a loader whose axes or weight differ from the preset's fontOptions would give installed projects a different face than the docs show.
const loaders = new Map()
for (const m of read("site/presets.ts").replace(/^\s*\/\/.*$/gm, "").matchAll(/\w+\(\{([^}]*)\}\)/g)) {
  const variable = /variable:\s*"(--[\w-]+)"/.exec(m[1])?.[1]
  if (!variable) continue
  const list = key => new RegExp(`\\b${key}:\\s*\\[([^\\]]*)\\]`).exec(m[1])?.[1].match(/"([^"]+)"/g)?.map(v => v.slice(1, -1)) ?? []
  loaders.set(variable, { axes: list("axes"), weight: list("weight") })
}

function themeItem(preset) {
  const { css } = parseCss(`styles/presets/${preset}.css`, Object.keys(tokens.presets[preset].primitives))
  const fonts = fontsOf(preset, tokens.presets[preset].fonts, tokens.presets[preset].fontOptions)
  for (const f of fonts) {
    const loader = loaders.get(f.variable)
    if (!loader) throw new Error(`preset ${preset} reads ${f.variable} but site/presets.ts declares no loader with variable: "${f.variable}"`)
    for (const [key, loaderKey] of [["axes", "axes"], ["weights", "weight"]]) {
      const [want, have] = [(f[key] ?? []).join(), loader[loaderKey].join()]
      if (want !== have) throw new Error(`preset ${preset}: ${f.variable} declares ${key} [${want}] but its loader in site/presets.ts passes ${loaderKey} [${have}]`)
    }
  }
  return {
    name: `theme-${preset}`,
    type: "registry:theme",
    title: `${titleCase(preset)} theme`,
    description: `${titleCase(preset)} preset values: colors for light and dark, fonts, weights, radii, type scale, control sizes, padding, border width and shadows. Install one theme; components do not change it.`,
    css,
    categories: ["theme"],
    docs: `${ORIGIN}/tokens/`,
    meta: { preset, modes: ["light", "dark", "os"], fonts },
  }
}

const presetNames = readdirSync(new URL("../styles/presets/", import.meta.url)).filter(f => f.endsWith(".css")).map(f => f.slice(0, -4)).sort((a, b) => (a === "ledger" ? -1 : b === "ledger" ? 1 : a.localeCompare(b)))
if (!presetNames.includes("ledger")) throw new Error("styles/presets/ledger.css is missing: fine-theme installs theme-ledger")
items.push(baseItem(), ...presetNames.map(themeItem), {
  name: ALIAS,
  type: "registry:theme",
  title: "Fine theme",
  description: "Alias of theme-ledger, so earlier install lines keep working.",
  registryDependencies: [registryUrl("theme-ledger")],
  categories: ["theme"],
  docs: `${ORIGIN}/tokens/`,
})

// ---------------------------------------------------------------- registry.json

const byName = Object.fromEntries(items.map(i => [i.name, i]))
for (const item of items) {
  for (const url of item.registryDependencies ?? []) {
    if (!(url.slice(`${ORIGIN}/r/`.length, -".json".length) in byName)) throw new Error(`${item.name}: dependency ${url} has no item`)
  }
}
const order = new Map(CATEGORIES.map((c, i) => [c, i]))
items.sort((a, b) => order.get(a.categories[0]) - order.get(b.categories[0]) || a.name.localeCompare(b.name))

writeFileSync(
  new URL("../registry.json", import.meta.url),
  JSON.stringify({ $schema: "https://ui.shadcn.com/schema/registry.json", name: "fine", homepage: ORIGIN, items }, null, 2) + "\n",
)

// ---------------------------------------------------------------- llms.txt

const docsLink = i => (i.docs ? `[${i.title}](${i.docs})` : i.title)
const line = i => `- ${docsLink(i)}: ${i.description} Registry: ${registryUrl(i.name)}`
const section = (title, cat) => `## ${title}\n\n${items.filter(i => i.categories[0] === cat).map(line).join("\n")}\n`
const tiers = Object.entries(JSON.parse(read("styles/tokens.json")).motion)
  .map(([tier, m]) => `${tier} ${Math.round((m.visualDuration ?? m.duration) * 1000)}ms enter / ${Math.round(m.exit * 1000)}ms exit`)
  .join(", ")

const llms = `# Fine

> React design system on Base UI, Tailwind CSS v4 and Motion, installed one component at a time as a shadcn registry. Behavior is the same in every project; appearance is a preset (${presetNames.join(", ")}).

## Conventions

- Direction: before a new site, page or screen, read the project's design doc or settle audience, content, typography, palette, composition, imagery and interaction character, then pick the closest preset (Ledger for dense data and operations tools) or derive one in scripts/presets/<name>.mjs. A small edit inside an existing screen follows that screen.
- Install: install one theme first, then components: \`npx shadcn@latest add ${ORIGIN}/r/theme-ledger.json\`, then \`npx shadcn@latest add ${ORIGIN}/r/<name>.json\`. Components, lib files, ${BASE} and npm packages come with it. The project needs React 19, Tailwind v4 and a components.json with the default aliases (\`@/components\`, \`@/components/ui\`, \`@/lib\`). After \`shadcn init\`, add \`--overwrite\` so fine's \`button\` and \`utils\` replace the ones init wrote.
- Base and theme: every component depends on \`${BASE}\`, never on a theme. It writes the \`@theme inline\` mappings, the \`figures\`, \`focus-ring\` and \`border-line\` utilities, the base layer, keyframes and motion scalars into globals.css, and Ledger's value for every token as a default in a cascade layer (\`@layer base\`), so a \`:root\` rule in your project or an installed theme always wins. Adding a component therefore never changes your look. The look comes from one theme, installed once on purpose: ${presetNames.map(n => "`theme-" + n + "`").join(", ")}; \`${ALIAS}\` is an alias of \`theme-ledger\`. A theme writes colors, fonts, weights, radii, type scale, control sizes, padding, border width and shadows to \`:root\`, \`.light\`, \`.dark\` and the OS dark query; installing another replaces them, and overrides belong in a later rule. It leaves Tailwind's own palette alone. Load the fonts listed in the theme item's \`meta.fonts\` (next/font, one CSS variable each, passing an entry's \`axes\` or \`weights\` when it lists them: Newsreader and Bricolage Grotesque need their opsz axis); Ledger needs Geist as \`--font-geist-sans\` and \`--font-geist-mono\`.
- Tokens: style with semantic utilities only: bg-background, bg-surface, text-foreground, text-muted-foreground, border-border, border-input, bg-primary, bg-secondary, status colors success, warning, danger, info (each with -foreground and -subtle). \`accent\` marks emphasis on data; how many a screen carries is the preset's call (Ledger: one, never chrome). A preset's accent, and its primary when chromatic, sits 40 degrees or more from danger's hue, so it never reads as an error (the token build enforces it: Ledger cobalt, Folio aubergine, Poster magenta). Preset utilities: \`rounded-control|container|small|pill\`, \`font-label|title|strong|display\`, \`h-control-sm|md|lg\`, \`px-pad-control-*|field-*\`, \`p-pad-container-*\`, \`border-line\`, \`shadow-raised|control|overlay\`; they follow the installed theme. Money, counts, IDs and addresses take \`figures\`.
- Dark mode: \`.dark\` or \`.light\` on \`<html>\` or any subtree; with neither, the OS setting decides. The \`dark:\` variant follows the same rule.
- Variants: components take \`variant\` and \`size\` props (cva). Each exported \`<name>Variants()\` styles other elements, e.g. \`<a className={buttonVariants({ variant: "outline" })}>\`. \`render\` swaps the rendered element. Each registry item lists its exports and variants in \`meta\`. Merge classes with \`cn\` from \`@/lib/utils\`.
- Motion: tiers ${tiers}. Fast: hover, focus, tooltips. Moderate: popups, drawers, indicators. Slow: dialogs, command palette. Expressive: toasts, the one overshoot. Enter on \`spring.<tier>\` from \`@/lib/motion\`, exit on its tween; CSS uses \`duration-(--duration-<tier>)\` with \`ease-spring-<tier>\`. Wrap the app in \`<MotionConfig reducedMotion="user">\`; reduced motion drops travel and keeps fades.
- Accessibility: Base UI supplies roles, keyboard handling and focus management. The focus ring is a 2px outline in the ring color (\`focus-visible:focus-ring\`), input borders keep 3:1 contrast, and every text pair in every preset passes WCAG AA at token build. Icon-only controls take a \`label\`.
- Forms: a field with a rule or format shows a hint with \`FieldDescription\` inside \`Field\`; Base UI links it to the input through aria-describedby. Ledger has no taglines or secondary labels; other presets follow their direction.
- Mount \`<Toaster />\` once for toast. \`TooltipProvider\` is optional: it lets the next tooltip in a toolbar open at once.

${section("Base", "base")}
${section("Theme", "theme")}
${section("Foundations", "foundations")}
${section("Inputs", "inputs")}
${section("Display", "display")}
${section("Feedback", "feedback")}
${section("Overlays", "overlays")}
${section("Navigation", "navigation")}
${section("Blocks", "blocks")}
${section("Lib", "lib")}`

writeFileSync(new URL("../public/llms.txt", import.meta.url), llms.replace(/\n{3,}/g, "\n\n").trimEnd() + "\n")
console.log(`registry.json: ${items.length} items (${items.filter(i => i.type === "registry:ui").length} ui, ${items.filter(i => i.type === "registry:block").length} blocks, ${items.filter(i => i.type === "registry:lib").length} lib, 1 base, ${items.filter(i => i.categories[0] === "theme").length} theme), public/llms.txt`)
