// Single source of truth for Fine's design tokens.
// `npm run tokens` writes styles/fine.css, styles/tokens.json and lib/motion.ts,
// then exits non-zero if any semantic pair misses WCAG AA or any color leaves sRGB.
import { writeFileSync } from "node:fs"

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

// ---------------------------------------------------------------- primitives

const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]

// Neutral ramp, tuned by hand for its roles (see SEMANTIC below).
const GRAY_HUE = 264
const GRAY = {
  50: [0.985, 0.002], 100: [0.965, 0.003], 200: [0.925, 0.003], 300: [0.87, 0.004],
  400: [0.72, 0.005], 500: [0.62, 0.005], 600: [0.52, 0.005], 700: [0.4, 0.004],
  800: [0.28, 0.003], 900: [0.21, 0.002], 950: [0.16, 0.002],
}

// Hue ramps share one lightness ladder and one chroma curve; chroma is
// clamped to the sRGB gamut so every emitted value is displayable as-is.
const LIGHTNESS = { 50: 0.975, 100: 0.945, 200: 0.89, 300: 0.82, 400: 0.73, 500: 0.64, 600: 0.55, 700: 0.47, 800: 0.4, 900: 0.33, 950: 0.26 }
const CHROMA_CURVE = { 50: 0.08, 100: 0.17, 200: 0.33, 300: 0.55, 400: 0.78, 500: 0.93, 600: 1, 700: 0.94, 800: 0.82, 900: 0.66, 950: 0.5 }
const HUES = {
  blue: { hue: 258, peak: 0.21 },
  red: { hue: 27, peak: 0.21 },
  green: { hue: 150, peak: 0.17 },
  amber: { hue: 75, peak: 0.17 },
}

const primitives = { white: [1, 0, 0], black: [0, 0, 0] }
for (const step of STEPS) primitives[`gray-${step}`] = [GRAY[step][0], GRAY[step][1], GRAY_HUE]
for (const [name, { hue, peak, curve = CHROMA_CURVE }] of Object.entries(HUES)) {
  for (const step of STEPS) {
    const L = LIGHTNESS[step]
    primitives[`${name}-${step}`] = [L, Math.min(peak * curve[step], maxChroma(L, hue) * 0.995), hue]
  }
}

// ---------------------------------------------------------------- semantic

// A string names a primitive. { mix, pct } is a translucent overlay:
// color-mix(in oklch, var(--mix) pct%, transparent).
const SEMANTIC = {
  light: {
    background: "gray-50", foreground: "gray-900", surface: "white",
    muted: "gray-100", "muted-foreground": "gray-600",
    border: "gray-200", input: "gray-500", ring: "gray-900",
    primary: "gray-900", "primary-foreground": "gray-50", "primary-hover": "gray-800", "primary-active": "gray-700",
    secondary: "gray-200", "secondary-foreground": "gray-900", "secondary-hover": "gray-300", "secondary-active": "gray-300",
    // The one hue: the main data element (a chart's current series, a selected value). Never chrome.
    accent: "blue-600", "accent-foreground": "white",
    success: "green-700", "success-foreground": "white", "success-subtle": "green-50", "success-subtle-foreground": "green-700",
    warning: "amber-400", "warning-foreground": "amber-950", "warning-subtle": "amber-50", "warning-subtle-foreground": "amber-800",
    danger: "red-600", "danger-foreground": "white", "danger-hover": "red-700", "danger-active": "red-800", "danger-subtle": "red-50", "danger-subtle-foreground": "red-700",
    info: "blue-600", "info-foreground": "white", "info-subtle": "blue-50", "info-subtle-foreground": "blue-700",
    hover: { mix: "gray-900", pct: 5 }, active: { mix: "gray-900", pct: 9 },
    overlay: { mix: "gray-950", pct: 40 }, "shadow-color": { mix: "gray-950", pct: 8 }
  },
  dark: {
    background: "gray-950", foreground: "gray-100", surface: "gray-900",
    muted: "gray-800", "muted-foreground": "gray-400",
    border: "gray-800", input: "gray-600", ring: "gray-100",
    primary: "gray-100", "primary-foreground": "gray-900", "primary-hover": "gray-200", "primary-active": "gray-300",
    secondary: "gray-800", "secondary-foreground": "gray-100", "secondary-hover": "gray-700", "secondary-active": "gray-600",
    accent: "blue-400", "accent-foreground": "gray-950",
    success: "green-700", "success-foreground": "white", "success-subtle": "green-950", "success-subtle-foreground": "green-300",
    warning: "amber-400", "warning-foreground": "amber-950", "warning-subtle": "amber-950", "warning-subtle-foreground": "amber-300",
    danger: "red-600", "danger-foreground": "white", "danger-hover": "red-700", "danger-active": "red-800", "danger-subtle": "red-950", "danger-subtle-foreground": "red-300",
    info: "blue-600", "info-foreground": "white", "info-subtle": "blue-950", "info-subtle-foreground": "blue-300",
    hover: { mix: "gray-100", pct: 6 }, active: { mix: "gray-100", pct: 10 },
    overlay: { mix: "black", pct: 60 }, "shadow-color": { mix: "black", pct: 50 }
  },
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

const THEME = {
  // Tailwind's own scale, declared explicitly so it is part of the contract.
  text: {
    "2xs": ["0.6875rem", "1rem"], xs: ["0.75rem", "1rem"], sm: ["0.875rem", "1.25rem"], base: ["1rem", "1.5rem"],
    lg: ["1.125rem", "1.75rem"], xl: ["1.25rem", "1.75rem"], "2xl": ["1.5rem", "2rem", "-0.01em"],
    "3xl": ["1.875rem", "2.25rem", "-0.02em"], "4xl": ["2.25rem", "2.5rem", "-0.025em"],
    "5xl": ["3rem", "1.1", "-0.03em"], "6xl": ["3.75rem", "1.05", "-0.035em"],
  },
  breakpoint: { sm: "40rem", md: "48rem", lg: "64rem", xl: "80rem", "2xl": "96rem" },
  radius: { control: "0.375rem", container: "0.5rem", pill: "9999px" },
  shadow: {
    xs: "0 1px 2px var(--shadow-color)",
    sm: "0 1px 2px var(--shadow-color), 0 1px 3px var(--shadow-color)",
    md: "0 2px 4px -1px var(--shadow-color), 0 4px 8px -2px var(--shadow-color)",
    lg: "0 0 0 1px var(--shadow-color), 0 4px 8px -2px var(--shadow-color), 0 12px 24px -4px var(--shadow-color)",
  },
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

const ROOT_SCALARS = {
  "font-sans": 'var(--font-geist-sans, "Geist"), ui-sans-serif, system-ui, sans-serif',
  "font-mono": 'var(--font-geist-mono, "Geist Mono"), ui-monospace, SFMono-Regular, monospace',
  ...Object.fromEntries(Object.entries(MOTION).flatMap(([tier, m]) => [
    [`duration-${tier}`, `${Math.round(m.duration * 1000)}ms`],
    [`duration-${tier}-exit`, `${Math.round(m.exit * 1000)}ms`],
  ])),
  "duration-expressive": `${expressive.settleMs}ms`,
  // Every figure, ID and address is set in the mono, tabular (the style's one job for a second face).
  "font-figure": "var(--font-mono)",
  "focus-ring-width": "2px", "focus-ring-offset": "2px",
  "border-hairline": "1px", "border-strong": "2px",
  "z-sticky": "100", "z-overlay": "200", "z-popover": "300", "z-toast": "400", "z-tooltip": "500",
}

// ---------------------------------------------------------------- resolve + check

const resolve = value => (typeof value === "string" ? primitives[value] : null)
const cssValue = value =>
  typeof value === "string" ? `var(--${value})` : `color-mix(in oklch, var(--${value.mix}) ${value.pct}%, transparent)`

let failures = 0
const report = []
for (const [name, lch] of Object.entries(primitives)) {
  if (!inGamut(...lch)) {
    failures++
    console.log(`GAMUT ${name} ${css(lch)}`)
  }
}
for (const mode of ["light", "dark"]) {
  const t = SEMANTIC[mode]
  for (const [fg, bg, min] of PAIRS) {
    const ratio = contrast(resolve(t[fg]), resolve(t[bg]))
    const pass = ratio >= min
    if (!pass) failures++
    report.push({ mode, fg, bg, ratio: Math.round(ratio * 100) / 100, min, pass })
  }
}

// ---------------------------------------------------------------- emit

const block = (selector, entries, indent = "  ") =>
  `${selector} {\n${entries.map(([k, v]) => `${indent}--${k}: ${v};`).join("\n")}\n}`

const semanticEntries = mode => Object.entries(SEMANTIC[mode]).map(([k, v]) => [k, cssValue(v)])
const colorNames = Object.keys(SEMANTIC.light).filter(k => k !== "shadow-color")

const out = `/* Generated by scripts/tokens.mjs. Edit that file and run \`npm run tokens\`. */

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

${block(":root", [
  ...Object.entries(primitives).map(([k, v]) => [k, css(v)]),
  ...Object.entries(ROOT_SCALARS),
  ...semanticEntries("light"),
])}

:root {
  color-scheme: light;
}

/* .light and .dark also scope a subtree, e.g. a dark section on a light page. */
${block(".light", semanticEntries("light"))}

.light {
  color-scheme: light;
}

${block(".dark", semanticEntries("dark"))}

.dark {
  color-scheme: dark;
}

@media (prefers-color-scheme: dark) {
  :root:not(.light) {
    color-scheme: dark;
${semanticEntries("dark").map(([k, v]) => `    --${k}: ${v};`).join("\n")}
  }
}

@theme static {
  --color-*: initial;
  --spacing: 0.25rem;
${Object.entries(THEME.text).map(([k, [size, lh, ls]]) => `  --text-${k}: ${size};\n  --text-${k}--line-height: ${lh};${ls ? `\n  --text-${k}--letter-spacing: ${ls};` : ""}`).join("\n")}
${Object.entries(THEME.breakpoint).map(([k, v]) => `  --breakpoint-${k}: ${v};`).join("\n")}
${Object.entries(THEME.radius).map(([k, v]) => `  --radius-${k}: ${v};`).join("\n")}
${Object.entries(THEME.ease).map(([k, v]) => `  --ease-${k}: ${v};`).join("\n")}
  --default-transition-timing-function: var(--ease-enter);
${Object.entries(THEME.animate).map(([k, v]) => `  --animate-${k}: ${v};`).join("\n")}
}

@theme inline {
${colorNames.map(k => `  --color-${k}: var(--${k});`).join("\n")}
  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
${Object.entries(THEME.shadow).map(([k, v]) => `  --shadow-${k}: ${v};`).join("\n")}
  --shadow-raised: none;
  --shadow-overlay: var(--shadow-lg);
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

writeFileSync(new URL("../styles/fine.css", import.meta.url), out)

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

const json = {
  primitives: Object.fromEntries(Object.entries(primitives).map(([k, v]) => [k, css(v)])),
  semantic: Object.fromEntries(["light", "dark"].map(mode => [mode, Object.fromEntries(Object.entries(SEMANTIC[mode]).map(([k, v]) => [k, typeof v === "string" ? v : `${v.mix} @ ${v.pct}%`]))])),
  scalars: ROOT_SCALARS,
  theme: THEME,
  motion: { ...MOTION, expressive: { ...EXPRESSIVE, duration: expressive.settleMs / 1000 } },
  contrast: report,
}
writeFileSync(new URL("../styles/tokens.json", import.meta.url), JSON.stringify(json, null, 2) + "\n")

for (const r of report) if (!r.pass) console.log(`FAIL ${r.mode} ${r.fg} on ${r.bg}: ${r.ratio} (min ${r.min})`)
const lowest = mode => report.filter(r => r.mode === mode).sort((a, b) => a.ratio / a.min - b.ratio / b.min)[0]
for (const mode of ["light", "dark"]) {
  const l = lowest(mode)
  console.log(`${mode}: ${report.filter(r => r.mode === mode && r.pass).length}/${report.filter(r => r.mode === mode).length} pairs pass; tightest ${l.fg} on ${l.bg} ${l.ratio}:1 (min ${l.min})`)
}
console.log(failures ? `${failures} failure(s)` : "contrast + gamut OK")
process.exit(failures ? 1 : 0)
