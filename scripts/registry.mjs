// Generates registry.json (shadcn registry schema) and public/llms.txt from the source, so neither drifts.
// `shadcn build` then turns registry.json into public/r/<name>.json (npm run registry:build).
// REGISTRY_URL is the origin the docs are served from; it is baked into registryDependencies and links.
import { readdirSync, readFileSync, writeFileSync } from "node:fs"
import postcss from "postcss"
import { blocks as navBlocks, components as navComponents } from "../site/nav.ts"

const ORIGIN = (process.env.REGISTRY_URL ?? "http://localhost:4319").replace(/\/$/, "")
const read = path => readFileSync(new URL(`../${path}`, import.meta.url), "utf8")
const pkg = JSON.parse(read("package.json"))

const THEME = "fine-theme"
const registryUrl = name => `${ORIGIN}/r/${name}.json`

// Per item: category and a one-line description. A file without an entry fails the build, so none is forgotten.
const CATEGORIES = ["foundations", "inputs", "display", "feedback", "overlays", "navigation", "blocks", "lib", "theme"]
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
  field: ["inputs", "Form, Field, label and error wired to Base UI validation."],
  card: ["display", "Surface with header, title, content and footer."],
  badge: ["display", "Compact status label in neutral and status tones."],
  avatar: ["display", "User image with an initials fallback."],
  tag: ["display", "Chip for a chosen value or filter, with an optional remove button."],
  kbd: ["display", "Keyboard key hint."],
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
  "auth-form": "Sign-in form with validation and an onSubmit handler.",
  hero: "Headline, two actions and a stack of ledger slips that settles in.",
  "feature-grid": "Heading and a grid of six icon features.",
  pricing: "Three plans with a monthly and yearly toggle and one recommended.",
  faq: "Accordion of questions with the first answer open.",
  footer: "Footer with four link columns.",
  "dashboard-shell": "App frame with sidebar, header and a paged table; fills its container.",
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

function sourceItem({ name, type, path, title, description, category, docs, theme }) {
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
    registryDependencies: [...(theme ? [registryUrl(THEME)] : []), ...registryDependencies],
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
    description, category, docs: `${ORIGIN}/components/${slug}/`, theme: true,
  }))
}
for (const [slug, description] of Object.entries(BLOCKS)) {
  items.push(sourceItem({
    name: slug, type: "registry:block", path: `components/blocks/${slug}.tsx`, title: titles[slug],
    description, category: "blocks", docs: `${ORIGIN}/blocks/${slug}/`, theme: true,
  }))
}
for (const file of libFiles) {
  const slug = slugOf(file)
  items.push(sourceItem({
    name: slug, type: "registry:lib", path: `lib/${file}`, title: slug, description: LIB[slug], category: "lib",
  }))
}

// ---------------------------------------------------------------- fine-theme

// styles/fine.css is the generated source of truth (scripts/tokens.mjs). It is split into what the shadcn CLI
// writes into a consumer's globals.css: cssVars.theme -> `@theme inline`, everything else -> the css field.
// Kept out on purpose: `--color-*: initial` (the consumer's Tailwind palette stays), spacing and breakpoints (Tailwind's own values).
function themeItem() {
  const root = postcss.parse(read("styles/fine.css"))
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
      for (const d of n.nodes) if (/^(white|black|(gray|blue|red|green|amber)-\d+)$/.test(d.prop.slice(2))) prims[d.prop.slice(2)] = d.value
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
  const colors = Object.keys(theme).filter(k => k.startsWith("color-")).map(k => k.slice(6))

  const tokens = JSON.parse(read("styles/tokens.json"))
  return {
    name: THEME,
    type: "registry:theme",
    title: "Fine theme",
    description: "Semantic color tokens for light and dark, motion scalars, type scale, radii, shadows and the figures and focus-ring utilities.",
    cssVars: { theme },
    css,
    categories: ["theme"],
    docs: `${ORIGIN}/tokens/`,
    meta: { colors, modes: ["light", "dark", "os"], motion: tokens.motion, fonts: ["--font-geist-sans", "--font-geist-mono"] },
  }
}
items.push(themeItem())

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

> React design system on Base UI, Tailwind CSS v4 and Motion, installed one component at a time as a shadcn registry.

## Conventions

- Install: \`npx shadcn@latest add ${ORIGIN}/r/<name>.json\`. Components, lib files, ${THEME} and npm packages come with it. The project needs React 19, Tailwind v4 and a components.json with the default aliases (\`@/components\`, \`@/components/ui\`, \`@/lib\`). After \`shadcn init\`, add \`--overwrite\` so fine's \`button\` and \`utils\` replace the ones init wrote.
- Theme: every component depends on \`${THEME}\`. It writes semantic color tokens to \`:root\` and \`.dark\`, the \`@theme inline\` mappings, the \`figures\` and \`focus-ring\` utilities and the motion scalars into globals.css. It leaves Tailwind's own palette alone, and adding any item re-applies its values to the first \`:root\` and \`.dark\` rule, so keep overrides in a later rule. Load Geist as \`--font-geist-sans\` and \`--font-geist-mono\` (next/font).
- Tokens: style with semantic utilities only: bg-background, bg-surface, text-foreground, text-muted-foreground, border-border, border-input, bg-primary, bg-secondary, status colors success, warning, danger, info (each with -foreground and -subtle). \`accent\` (cobalt) marks a screen's main data element, never chrome. Radii: \`rounded-control\`, \`rounded-container\`. Money, counts, IDs and addresses take \`figures\`.
- Dark mode: \`.dark\` or \`.light\` on \`<html>\` or any subtree; with neither, the OS setting decides. The \`dark:\` variant follows the same rule.
- Variants: components take \`variant\` and \`size\` props (cva). Each exported \`<name>Variants()\` styles other elements, e.g. \`<a className={buttonVariants({ variant: "outline" })}>\`. \`render\` swaps the rendered element. Each registry item lists its exports and variants in \`meta\`. Merge classes with \`cn\` from \`@/lib/utils\`.
- Motion: tiers ${tiers}. Fast: hover, focus, tooltips. Moderate: popups, drawers, indicators. Slow: dialogs, command palette. Expressive: toasts, the one overshoot. Enter on \`spring.<tier>\` from \`@/lib/motion\`, exit on its tween; CSS uses \`duration-(--duration-<tier>)\` with \`ease-spring-<tier>\`. Wrap the app in \`<MotionConfig reducedMotion="user">\`; reduced motion drops travel and keeps fades.
- Accessibility: Base UI supplies roles, keyboard handling and focus management. The focus ring is a 2px ink outline (\`focus-visible:focus-ring\`), input borders keep 3:1 contrast, and every text pair passes WCAG AA at token build. Icon-only controls take a \`label\`.
- Mount \`<Toaster />\` once for toast. \`TooltipProvider\` is optional: it lets the next tooltip in a toolbar open at once.

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
console.log(`registry.json: ${items.length} items (${items.filter(i => i.type === "registry:ui").length} ui, ${items.filter(i => i.type === "registry:block").length} blocks, ${items.filter(i => i.type === "registry:lib").length} lib, 1 theme), public/llms.txt`)
