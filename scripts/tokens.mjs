// Single source of truth for Fine's design tokens.
// Appearance lives in presets (scripts/presets/*.mjs, one file per look); this file holds what every preset shares:
// the OKLCH math, the contrast gate (PAIRS), motion and the emitters. `npm run tokens` writes
//   styles/fine.css            the base: Ledger (the docs default) plus the Tailwind mapping
//   styles/presets/<name>.css  one preset's values, unscoped
//   styles/presets.css         every non-Ledger preset scoped by :root[data-preset="<name>"], for the docs
//   styles/tokens.json, lib/motion.ts
// then exits non-zero if any preset has a semantic pair under its minimum, a color outside sRGB, or an accent (or a
// chromatic primary) too close to danger in hue.
import { mkdirSync, readdirSync, writeFileSync } from "node:fs"

// ---------------------------------------------------------------- OKLCH math

function toLinearSrgb(L, C, H) {
  const h = (H * Math.PI) / 180
  const a = C * Math.cos(h)
  const b = C * Math.sin(h)
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
}

const inGamut = (L, C, H) => toLinearSrgb(L, C, H).every(c => c >= -0.0005 && c <= 1.0005)

function maxChroma(L, H) {
  let lo = 0
  let hi = 0.4
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2
    if (inGamut(L, mid, H)) lo = mid
    else hi = mid
  }
  return lo
}

const luminance = ([L, C, H]) => {
  const [r, g, b] = toLinearSrgb(L, C, H).map(c => Math.min(1, Math.max(0, c)))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

const round = n => Math.round(n * 1000) / 1000
const css = ([L, C, H]) => `oklch(${round(L)} ${round(C)} ${H})`

// ---------------------------------------------------------------- presets

const DEFAULT_PRESET = "ledger"
const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]

const presetDir = new URL("./presets/", import.meta.url)
const presetFiles = readdirSync(presetDir).filter(f => f.endsWith(".mjs")).map(f => f.slice(0, -4))
if (!presetFiles.includes(DEFAULT_PRESET)) throw new Error(`scripts/presets/${DEFAULT_PRESET}.mjs is missing: it is the base of fine.css`)
presetFiles.sort((a, b) => (a === DEFAULT_PRESET ? -1 : b === DEFAULT_PRESET ? 1 : a.localeCompare(b)))

const SHADOWS = ["xs", "sm", "md", "lg", "raised", "control", "overlay"]
const WEIGHTS = ["label", "title", "strong"]
const RADII = ["control", "container", "small", "pill"]
const SIZES = ["sm", "md", "lg"]

function validate(file, p, semanticKeys) {
  const fail = what => { throw new Error(`preset ${file}: ${what}`) }
  if (p.name !== file) fail(`name "${p.name}" must match the file name`)
  for (const key of ["palette", "semantic", "fonts", "weights", "text", "radius", "borderWidth", "control", "padding", "shadows"]) if (!(key in p)) fail(`missing "${key}"`)
  for (const k of ["sans", "mono", "heading", "figure"]) if (!p.fonts[k]) fail(`fonts.${k} missing`)
  for (const k of WEIGHTS) if (!p.weights[k]) fail(`weights.${k} missing`)
  for (const k of RADII) if (!p.radius[k]) fail(`radius.${k} missing`)
  for (const k of SIZES) if (!p.control[k]) fail(`control.${k} missing`)
  for (const group of ["control", "field", "container"]) for (const k of SIZES) if (!p.padding[group]?.[k]) fail(`padding.${group}.${k} missing`)
  for (const k of SHADOWS) if (!p.shadows[k]) fail(`shadows.${k} missing`)
  for (const mode of ["light", "dark"]) for (const k of semanticKeys) if (!(k in (p.semantic[mode] ?? {}))) fail(`semantic.${mode}.${k} missing`)
  // Optional next/font options for a family the stacks name, keyed by its CSS variable. next/font accepts axes only
  // for a variable-weight load, so a family takes `axes` or `weights`, not both.
  for (const [variable, o] of Object.entries(p.fontOptions ?? {})) {
    if (!Object.values(p.fonts).some(stack => stack.includes(`var(${variable},`))) fail(`fontOptions.${variable}: no font stack reads it as var(${variable}, "Family")`)
    for (const k of Object.keys(o)) if (k !== "axes" && k !== "weights") fail(`fontOptions.${variable}.${k}: only axes and weights are allowed`)
    for (const k of ["axes", "weights"]) if (k in o && !(Array.isArray(o[k]) && o[k].length && o[k].every(v => typeof v === "string"))) fail(`fontOptions.${variable}.${k} must be a non-empty array of strings`)
    if (o.axes && o.weights) fail(`fontOptions.${variable}: axes need a variable-weight load, so it cannot also list weights`)
  }
}

// Primitives from a preset's ramp parameters: white, black, gray-*, and one ramp per entry in `hues` (blue, red, green,
// amber, or a preset's own such as plum or magenta). The semantic tokens read them by name, and so does the registry theme.
function buildPrimitives({ grayHue, gray, lightness, chroma, hues }) {
  const out = { white: [1, 0, 0], black: [0, 0, 0] }
  for (const step of STEPS) out[`gray-${step}`] = [gray[step][0], gray[step][1], grayHue]
  for (const [name, { hue, peak, curve = chroma }] of Object.entries(hues)) {
    for (const step of STEPS) {
      const L = lightness[step]
      out[`${name}-${step}`] = [L, Math.min(peak * curve[step], maxChroma(L, hue) * 0.995), hue]
    }
  }
  return out
}

const STATUSES = ["success", "warning", "danger", "info"]
const PAIRS = [
  ...["background", "surface", "muted"].flatMap(bg => [["foreground", bg, 4.5], ["muted-foreground", bg, 4.5]]),
  ["primary-foreground", "primary", 4.5], ["primary-foreground", "primary-hover", 4.5], ["primary-foreground", "primary-active", 4.5],
  ["secondary-foreground", "secondary", 4.5], ["secondary-foreground", "secondary-hover", 4.5], ["secondary-foreground", "secondary-active", 4.5],
  ["accent-foreground", "accent", 4.5], ["accent", "background", 3], ["accent", "surface", 3],
  ...STATUSES.flatMap(s => [
    [`${s}-foreground`, s, 4.5], [`${s}-subtle-foreground`, `${s}-subtle`, 4.5],
    [`${s}-subtle-foreground`, "background", 4.5], [`${s}-subtle-foreground`, "surface", 4.5],
  ]),
  ["danger-foreground", "danger-hover", 4.5], ["danger-foreground", "danger-active", 4.5],
  ["input", "background", 3], ["input", "surface", 3],
  ["ring", "background", 3], ["ring", "surface", 3],
  ["primary", "background", 3], ["primary", "surface", 3],
]

// Accent and a chromatic primary must not read as danger: a positive balance in the accent color would look negative.
// Below the chroma floor a color is grey and has no hue to compare, so an ink primary is exempt.
const HUE_GATE = { roles: ["accent", "primary"], minGap: 40, minChroma: 0.04 }
const hueGap = (a, b) => {
  const d = Math.abs(a - b) % 360
  return d > 180 ? 360 - d : d
}

// ---------------------------------------------------------------- scales

const MOTION = {
  // Fluid Functionalism tiers (mickadesign/fluid-functionalism, MIT): enter on
  // a spring, exit on a tween one tier quicker. Bigger movers use slower tiers.
  fast: { duration: 0.08, bounce: 0, exit: 0.06 },
  moderate: { duration: 0.16, bounce: 0, exit: 0.12 },
  slow: { duration: 0.24, bounce: 0.12, exit: 0.16 },
}

// Expressive tier, for feedback arriving (a toast, a confirmation): the one visible overshoot.
// Spring from Rare UI's FAQ reply bubble, SEND (rareui.com, MIT + Commons Clause + Attribution);
// exits on slow's exit tween. Motion defines it by visualDuration; the CSS side cannot, so we
// run the same underdamped spring Motion would (motion-dom springGenerator: omega0 = 2pi / (1.2 * visualDuration),
// damping ratio = 1 - bounce) and take its settle time within 0.1% as the duration.
const EXPRESSIVE = { visualDuration: 0.42, bounce: 0.28, exit: MOTION.slow.exit }

function expressiveSpring({ visualDuration, bounce }) {
  const zeta = 1 - bounce
  const w0 = (2 * Math.PI) / (1.2 * visualDuration)
  const wd = w0 * Math.sqrt(1 - zeta * zeta)
  const at = t => 1 - Math.exp(-zeta * w0 * t) * (Math.cos(wd * t) + ((zeta * w0) / wd) * Math.sin(wd * t))
  let settleMs = 0
  for (let ms = 0; ms <= 10000; ms++) if (Math.abs(at(ms / 1000) - 1) > 0.001) settleMs = ms + 1
  const points = Math.ceil(settleMs / 20)
  const samples = Array.from({ length: points }, (_, i) => Math.round(at(((i + 1) / points) * (settleMs / 1000)) * 1e4) / 1e4)
  samples[points - 1] = 1
  return { settleMs, ease: `linear(0, ${samples.join(", ")})` }
}
const expressive = expressiveSpring(EXPRESSIVE)

// System-wide, shared by every preset. Motion is deliberately not part of a look.
const THEME = {
  breakpoint: { sm: "40rem", md: "48rem", lg: "64rem", xl: "80rem", "2xl": "96rem" },
  animate: {
    // Fluid Functionalism's loading spinner (see @keyframes below).
    spinner: "spinner-move 2s linear infinite, spinner-dash 4s ease-in-out infinite",
    // Skeleton and indeterminate progress; Tailwind's 2s cycle and curve, owned here (see @keyframes below).
    pulse: "pulse-fade 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
  },
  ease: {
    // Fluid's press-release curve and Motion's easeIn for exits. `enter` is also Tailwind's default
    // transition curve (--default-transition-timing-function below), so a bare transition-colors stays on a token.
    enter: "cubic-bezier(0.23, 1, 0.32, 1)",
    exit: "cubic-bezier(0.42, 0, 1, 1)",
    // Fluid's CSS stand-ins for spring.moderate / spring.slow (reveal-product / reveal-landing).
    "spring-moderate": "linear(0, 0.5729, 0.8966, 0.9789, 0.996, 1, 1)",
    "spring-slow": "linear(0, 0.3878, 0.7777, 0.9458, 0.9946, 1.0029, 1.0021, 1)",
    // Rare UI FAQ SEND spring, simulated to its 0.1% settle (see EXPRESSIVE).
    "spring-expressive": expressive.ease,
  },
}

const DURATIONS = {
  ...Object.fromEntries(Object.entries(MOTION).flatMap(([tier, m]) => [
    [`duration-${tier}`, `${Math.round(m.duration * 1000)}ms`],
    [`duration-${tier}-exit`, `${Math.round(m.exit * 1000)}ms`],
  ])),
  "duration-expressive": `${expressive.settleMs}ms`,
}
const SYSTEM_SCALARS = {
  ...DURATIONS,
  "focus-ring-width": "2px", "focus-ring-offset": "2px",
  "border-hairline": "1px", "border-strong": "2px",
  "z-sticky": "100", "z-overlay": "200", "z-popover": "300", "z-toast": "400", "z-tooltip": "500",
}

// ---------------------------------------------------------------- load + check

const resolve = (p, value) => (typeof value === "string" ? p.prims[value] : null)
const cssValue = value =>
  typeof value === "string" ? `var(--${value})` : `color-mix(in oklch, var(--${value.mix}) ${value.pct}%, transparent)`

const presets = []
for (const file of presetFiles) presets.push((await import(new URL(`${file}.mjs`, presetDir).href)).default)
const semanticKeys = Object.keys(presets[0].semantic.light)
presets.forEach((p, i) => validate(presetFiles[i], p, semanticKeys))

let failures = 0
for (const p of presets) {
  p.prims = buildPrimitives(p.palette)
  p.report = []
  p.hueReport = []
  for (const [name, lch] of Object.entries(p.prims)) {
    if (!inGamut(...lch)) {
      failures++
      console.log(`GAMUT ${p.name} ${name} ${css(lch)}`)
    }
  }
  for (const mode of ["light", "dark"]) {
    const t = p.semantic[mode]
    for (const [fg, bg, min] of PAIRS) {
      const [a, b] = [resolve(p, t[fg]), resolve(p, t[bg])]
      if (!a || !b) throw new Error(`preset ${p.name}: ${mode} ${fg} and ${bg} must each name a primitive`)
      const ratio = contrast(a, b)
      const pass = ratio >= min
      if (!pass) failures++
      p.report.push({ mode, fg, bg, ratio: Math.round(ratio * 100) / 100, min, pass })
    }
    const danger = resolve(p, t.danger)
    if (!danger) throw new Error(`preset ${p.name}: ${mode} danger must name a primitive`)
    for (const role of HUE_GATE.roles) {
      const color = resolve(p, t[role])
      if (!color) throw new Error(`preset ${p.name}: ${mode} ${role} must name a primitive`)
      const chromatic = color[1] >= HUE_GATE.minChroma
      const gap = Math.round(hueGap(color[2], danger[2]))
      const pass = !chromatic || gap >= HUE_GATE.minGap
      if (!pass) failures++
      p.hueReport.push({ mode, role, hue: color[2], chroma: round(color[1]), dangerHue: danger[2], gap, minGap: HUE_GATE.minGap, chromatic, pass })
    }
  }
}

// ---------------------------------------------------------------- emit

const block = (selector, entries, indent = "  ") =>
  `${selector} {\n${entries.map(([k, v]) => `${indent}--${k}: ${v};`).join("\n")}\n}`

const primitiveEntries = p => Object.entries(p.prims).map(([k, v]) => [k, css(v)])
const textEntries = p =>
  Object.entries(p.text).flatMap(([k, [size, lh, ls]]) => [[`text-${k}`, size], [`text-${k}--line-height`, lh], ...(ls ? [[`text-${k}--letter-spacing`, ls]] : [])])
const PADDINGS = ["control", "field", "container"]
// Everything a preset sets besides color: declared once at the root, not per light/dark scope.
// The heading font is --font-display, not --font-heading: shadcn init writes `--font-heading: var(--font-sans)` into the project, and the CLI keeps existing theme keys.
const shapeEntries = p => [
  ["font-sans", p.fonts.sans], ["font-mono", p.fonts.mono], ["font-display", p.fonts.heading], ["font-figure", p.fonts.figure],
  ...WEIGHTS.map(k => [`weight-${k}`, p.weights[k]]),
  ...RADII.map(k => [`radius-${k}`, p.radius[k]]),
  ...textEntries(p),
  ["border-width", p.borderWidth],
  ...SIZES.map(k => [`control-${k}`, p.control[k]]),
  ...PADDINGS.flatMap(g => SIZES.map(k => [`pad-${g}-${k}`, p.padding[g][k]])),
]
// Colors and shadows change with the scope's light/dark, so they are re-declared in each. Only the shadows
// that are variables (MODE_SHADOWS) are declared; the three smaller steps stay literals inside @theme inline, as they
// always were: Tailwind resolves them where used. Declaring them would change the docs /tokens/ swatches, which read
// them as variables that were never set, so they render flat.
const MODE_SHADOWS = ["lg", "raised", "control", "overlay"]
const modeEntries = (p, mode) => [
  ...Object.entries(p.semantic[mode]).map(([k, v]) => [k, cssValue(v)]),
  ...MODE_SHADOWS.map(k => [`shadow-${k}`, p.shadows[k]]),
]
const colorNames = Object.keys(presets[0].semantic.light).filter(k => k !== "shadow-color")

// A preset's values with no scoping: the base of fine.css (with the system scalars) and styles/presets/<name>.css.
const unscoped = (p, system) => `${block(":root", [
  ...primitiveEntries(p),
  ...shapeEntries(p),
  ...(system ? Object.entries(SYSTEM_SCALARS) : []),
  ...modeEntries(p, "light"),
])}

:root {
  color-scheme: light;
}

/* .light and .dark also scope a subtree, e.g. a dark section on a light page. */
${block(".light", modeEntries(p, "light"))}

.light {
  color-scheme: light;
}

${block(".dark", modeEntries(p, "dark"))}

.dark {
  color-scheme: dark;
}

@media (prefers-color-scheme: dark) {
  :root:not(.light) {
    color-scheme: dark;
${modeEntries(p, "dark").map(([k, v]) => `    --${k}: ${v};`).join("\n")}
  }
}
`

// A non-default preset for the docs: set data-preset="<name>" on <html>. Every selector out-ranks the Ledger rules in fine.css.
const scoped = p => {
  const root = `:root[data-preset="${p.name}"]`
  return `${block(root, [...primitiveEntries(p), ...shapeEntries(p), ...modeEntries(p, "light")])}

${block(`${root}.dark`, modeEntries(p, "dark"))}

@media (prefers-color-scheme: dark) {
  ${root}:not(.light) {
${modeEntries(p, "dark").map(([k, v]) => `    --${k}: ${v};`).join("\n")}
  }
}

/* A .light or .dark subtree inside the preset. */
${block(`[data-preset="${p.name}"] .light`, modeEntries(p, "light"))}

${block(`[data-preset="${p.name}"] .dark`, modeEntries(p, "dark"))}
`
}

const ledger = presets[0]
const textKeys = Object.keys(ledger.text)
const themeMap = (key, source) => `  --${key}: var(--${source});`
const out = `/* Generated by scripts/tokens.mjs. Edit that file and scripts/presets/ledger.mjs, then run \`npm run tokens\`. */

/* \`dark:\` follows the .dark class, or the OS setting when neither .dark nor .light is set. */
@custom-variant dark {
  &:where(.dark, .dark *) {
    @slot;
  }
  @media (prefers-color-scheme: dark) {
    &:where(:root:not(.light), :root:not(.light) *) {
      @slot;
    }
  }
}

${unscoped(ledger, true)}
@theme static {
  --color-*: initial;
  --spacing: 0.25rem;
${Object.entries(THEME.breakpoint).map(([k, v]) => `  --breakpoint-${k}: ${v};`).join("\n")}
${Object.entries(THEME.ease).map(([k, v]) => `  --ease-${k}: ${v};`).join("\n")}
  --default-transition-timing-function: var(--ease-enter);
${Object.entries(THEME.animate).map(([k, v]) => `  --animate-${k}: ${v};`).join("\n")}
}

/* Utilities map to the variables above, so a preset only has to change the variables. */
@theme inline {
${colorNames.map(k => themeMap(`color-${k}`, k)).join("\n")}
${["sans", "mono", "display"].map(k => themeMap(`font-${k}`, `font-${k}`)).join("\n")}
${WEIGHTS.map(k => themeMap(`font-weight-${k}`, `weight-${k}`)).join("\n")}
${RADII.map(k => themeMap(`radius-${k}`, `radius-${k}`)).join("\n")}
${textKeys.map(k => [themeMap(`text-${k}`, `text-${k}`), themeMap(`text-${k}--line-height`, `text-${k}--line-height`), ...(ledger.text[k][2] ? [themeMap(`text-${k}--letter-spacing`, `text-${k}--letter-spacing`)] : [])].join("\n")).join("\n")}
${SIZES.map(k => themeMap(`spacing-control-${k}`, `control-${k}`)).join("\n")}
${PADDINGS.flatMap(g => SIZES.map(k => themeMap(`spacing-pad-${g}-${k}`, `pad-${g}-${k}`))).join("\n")}
${SHADOWS.map(k => (MODE_SHADOWS.includes(k) ? themeMap(`shadow-${k}`, `shadow-${k}`) : `  --shadow-${k}: ${ledger.shadows[k]};`)).join("\n")}
}

/* Figures: money, counts, IDs, addresses. Tabular so columns align. */
@utility figures {
  font-family: var(--font-figure);
  font-variant-numeric: tabular-nums;
}

@utility focus-ring {
  outline: var(--focus-ring-width) solid var(--ring);
  outline-offset: var(--focus-ring-offset);
}

/* Control and container outlines. Tailwind's \`border\` is fixed at 1px; these read --border-width, so a preset
   changes every outline by changing one token. Colors and \`border-0\` still come from the usual utilities. */
@utility border-line {
  border-style: var(--tw-border-style, solid);
  border-width: var(--border-width);
}
${["top", "right", "bottom", "left"].map(side => `
@utility border-${side[0]}-line {
  border-${side}-style: var(--tw-border-style, solid);
  border-${side}-width: var(--border-width);
}`).join("\n")}

@layer base {
  *,
  ::before,
  ::after {
    border-color: var(--border);
  }
  body {
    background-color: var(--background);
    color: var(--foreground);
    font-family: var(--font-sans);
    -webkit-font-smoothing: antialiased;
  }
  :focus-visible {
    outline: var(--focus-ring-width) solid var(--ring);
    outline-offset: var(--focus-ring-offset);
  }
}

/* Reduced motion: popups, dialogs and toasts keep their fades and drop all travel. */
@media (prefers-reduced-motion: reduce) {
  [data-starting-style],
  [data-ending-style] {
    translate: none !important;
    scale: none !important;
  }
}

/* Skeleton and indeterminate progress. */
@keyframes pulse-fade {
  50% {
    opacity: 0.5;
  }
}

/* Fluid Functionalism button spinner. */
@keyframes spinner-move {
  to {
    stroke-dashoffset: -100;
  }
}
@keyframes spinner-dash {
  0%,
  100% {
    stroke-dasharray: 15 85;
  }
  50% {
    stroke-dasharray: 40 60;
  }
}
`

const write = (path, text) => writeFileSync(new URL(`../${path}`, import.meta.url), text)
write("styles/fine.css", out)

mkdirSync(new URL("../styles/presets/", import.meta.url), { recursive: true })
for (const p of presets) {
  write(`styles/presets/${p.name}.css`, `/* Generated by scripts/tokens.mjs from scripts/presets/${p.name}.mjs. Unscoped: the registry theme item for this preset. */\n\n${unscoped(p, false)}`)
}
write(
  "styles/presets.css",
  `/* Generated by scripts/tokens.mjs. Every preset except ${DEFAULT_PRESET}, scoped for the docs: set data-preset="<name>" on <html>. Import after fine.css. */\n${presets.slice(1).map(p => `\n/* ${p.name} */\n${scoped(p)}`).join("")}`,
)

const bezier = value => value.match(/cubic-bezier\((.+)\)/)[1].split(",").map(Number)

const motionTs = `// Generated by scripts/tokens.mjs. Edit the MOTION tokens there and run \`npm run tokens\`.
// Tiers from Fluid Functionalism (MIT). Enter on the spring; exit on \`.exit\`,
// a tween one tier quicker. The bigger the thing that moves, the slower the tier.
// \`expressive\` is Rare UI's FAQ SEND spring (rareui.com), for feedback arriving; it exits on slow's tween.
//
//   <motion.div transition={spring.fast} exit={{ opacity: 0, transition: { ...spring.fast.exit, ease: easing.exit } }} />
export const spring = {
${Object.entries(MOTION).map(([tier, m]) => `  ${tier}: { type: "spring", duration: ${m.duration}, bounce: ${m.bounce}, exit: { duration: ${m.exit} } },`).join("\n")}
  expressive: { type: "spring", visualDuration: ${EXPRESSIVE.visualDuration}, bounce: ${EXPRESSIVE.bounce}, exit: { duration: ${EXPRESSIVE.exit} } },
} as const

export type SpringTier = keyof typeof spring

/** The CSS --ease-enter and --ease-exit curves, for Motion tweens (Motion defaults to easeOut). */
export const easing = {
  enter: [${bezier(THEME.ease.enter).join(", ")}],
  exit: [${bezier(THEME.ease.exit).join(", ")}],
} as const

/** Force-unmount delay for exits a throttled tab might stall: exit duration + 100ms. */
export const exitFallbackMs = (tier: SpringTier) => Math.round(spring[tier].exit.duration * 1000) + 100
`
writeFileSync(new URL("../lib/motion.ts", import.meta.url), motionTs)

// Top-level keys are Ledger's, the shape app/tokens/ reads; \`presets\` repeats the shape for every preset.
const jsonOf = p => ({
  primitives: Object.fromEntries(primitiveEntries(p)),
  semantic: Object.fromEntries(["light", "dark"].map(mode => [mode, Object.fromEntries(Object.entries(p.semantic[mode]).map(([k, v]) => [k, typeof v === "string" ? v : `${v.mix} @ ${v.pct}%`]))])),
  scalars: {
    "font-sans": p.fonts.sans, "font-mono": p.fonts.mono, ...DURATIONS, "font-figure": p.fonts.figure,
    ...Object.fromEntries(Object.entries(SYSTEM_SCALARS).filter(([k]) => !(k in DURATIONS))),
  },
  theme: {
    text: p.text,
    breakpoint: THEME.breakpoint,
    radius: { control: p.radius.control, container: p.radius.container, pill: p.radius.pill },
    shadow: { xs: p.shadows.xs, sm: p.shadows.sm, md: p.shadows.md, lg: p.shadows.lg },
    animate: THEME.animate,
    ease: THEME.ease,
  },
  motion: { ...MOTION, expressive: { ...EXPRESSIVE, duration: expressive.settleMs / 1000 } },
  contrast: p.report,
  accentDanger: p.hueReport,
  fontOptions: p.fontOptions ?? {},
  // Per-preset appearance tokens (theme.radius above keeps its original three keys for the docs page).
  fonts: p.fonts,
  weights: p.weights,
  radii: p.radius,
  borderWidth: p.borderWidth,
  control: p.control,
  padding: p.padding,
  shadows: p.shadows,
})
const json = { ...jsonOf(ledger), presets: Object.fromEntries(presets.map(p => [p.name, jsonOf(p)])) }
write("styles/tokens.json", JSON.stringify(json, null, 2) + "\n")

for (const p of presets) {
  for (const r of p.report) if (!r.pass) console.log(`FAIL ${p.name} ${r.mode} ${r.fg} on ${r.bg}: ${r.ratio} (min ${r.min})`)
  const lowest = mode => p.report.filter(r => r.mode === mode).sort((a, b) => a.ratio / a.min - b.ratio / b.min)[0]
  for (const r of p.hueReport) {
    if (!r.pass) console.log(`FAIL ${p.name} ${r.mode} ${r.role} vs danger: hue ${r.hue} and ${r.dangerHue} are ${r.gap}° apart (min ${r.minGap}° at chroma ${HUE_GATE.minChroma} or more; ${r.role} chroma ${r.chroma})`)
  }
  for (const mode of ["light", "dark"]) {
    const l = lowest(mode)
    console.log(`${p.name} ${mode}: ${p.report.filter(r => r.mode === mode && r.pass).length}/${p.report.filter(r => r.mode === mode).length} pairs pass; tightest ${l.fg} on ${l.bg} ${l.ratio}:1 (min ${l.min})`)
    const roles = p.hueReport.filter(r => r.mode === mode).map(r => (r.chromatic ? `${r.role} ${r.gap}° from danger` : `${r.role} grey, exempt`))
    console.log(`${p.name} ${mode}: accent/danger gate (min ${HUE_GATE.minGap}°): ${roles.join("; ")}`)
  }
}
console.log(failures ? `${failures} failure(s)` : `contrast + gamut + accent/danger hue OK (${presets.map(p => p.name).join(", ")})`)
process.exit(failures ? 1 : 0)
