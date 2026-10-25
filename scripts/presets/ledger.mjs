// Ledger: the achromatic ledger. Ink chrome, grey secondary, cobalt accent, Geist, 6/8px radii, flat at rest.
// A preset is appearance only; roles, keyboard, focus, validation and motion are the same for every preset.
// `npm run tokens` discovers scripts/presets/*.mjs, gates each one (sRGB gamut + WCAG pairs) and writes
// styles/presets/<name>.css. Ledger is also the base of styles/fine.css, so it is the docs default.
export default {
  name: "ledger",

  // ---------------------------------------------------------------- palette
  // Ramp parameters, not colors: tokens.mjs turns them into OKLCH primitives clamped to sRGB.
  palette: {
    // Neutral ramp, [lightness, chroma] per step, tuned by hand for its roles (see semantic below).
    grayHue: 264,
    gray: {
      50: [0.985, 0.002], 100: [0.965, 0.003], 200: [0.925, 0.003], 300: [0.87, 0.004],
      400: [0.72, 0.005], 500: [0.62, 0.005], 600: [0.52, 0.005], 700: [0.4, 0.004],
      800: [0.28, 0.003], 900: [0.21, 0.002], 950: [0.16, 0.002],
    },
    // Hue ramps share one lightness ladder and one chroma curve; chroma is clamped to the sRGB gamut.
    lightness: { 50: 0.975, 100: 0.945, 200: 0.89, 300: 0.82, 400: 0.73, 500: 0.64, 600: 0.55, 700: 0.47, 800: 0.4, 900: 0.33, 950: 0.26 },
    chroma: { 50: 0.08, 100: 0.17, 200: 0.33, 300: 0.55, 400: 0.78, 500: 0.93, 600: 1, 700: 0.94, 800: 0.82, 900: 0.66, 950: 0.5 },
    hues: {
      blue: { hue: 258, peak: 0.21 },
      red: { hue: 27, peak: 0.21 },
      green: { hue: 150, peak: 0.17 },
      amber: { hue: 75, peak: 0.17 },
    },
  },

  // A string names a primitive. { mix, pct } is a translucent overlay:
  // color-mix(in oklch, var(--mix) pct%, transparent).
  semantic: {
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
      overlay: { mix: "gray-950", pct: 40 }, "shadow-color": { mix: "gray-950", pct: 8 },
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
      overlay: { mix: "black", pct: 60 }, "shadow-color": { mix: "black", pct: 50 },
    },
  },

  // ---------------------------------------------------------------- fonts
  // sans: body and UI. heading: Heading, card/dialog/drawer titles. mono: code. figure: money, counts, IDs (the `figures` utility).
  fonts: {
    sans: 'var(--font-geist-sans, "Geist"), ui-sans-serif, system-ui, sans-serif',
    mono: 'var(--font-geist-mono, "Geist Mono"), ui-monospace, SFMono-Regular, monospace',
    heading: "var(--font-sans)",
    figure: "var(--font-mono)",
  },
  // Widest digit or money glyph ($ , . + −) of the figure face, in em. `figure-fit` sizes a stat from it, and
  // tests/layout.spec.ts fails a value below what the face measures.
  figureAdvance: 0.6,

  // ---------------------------------------------------------------- weights
  // label: buttons, control and field labels, tabs, table heads. title: Heading and in-flow titles.
  // strong: container titles (card, dialog, drawer) and the wordmark.
  weights: { label: 500, title: 500, strong: 600 },

  // ---------------------------------------------------------------- sizes
  // Type scale: [size, line-height, letter-spacing?].
  text: {
    "2xs": ["0.6875rem", "1rem"], xs: ["0.75rem", "1rem"], sm: ["0.875rem", "1.25rem"], base: ["1rem", "1.5rem"],
    lg: ["1.125rem", "1.75rem"], xl: ["1.25rem", "1.75rem"], "2xl": ["1.5rem", "2rem", "-0.01em"],
    "3xl": ["1.875rem", "2.25rem", "-0.02em"], "4xl": ["2.25rem", "2.5rem", "-0.025em"],
    "5xl": ["3rem", "1.1", "-0.03em"], "6xl": ["3.75rem", "1.05", "-0.035em"],
  },

  // ---------------------------------------------------------------- shape
  // small: marks inside a control (checkbox box, kbd, tag remove). Circles (avatar, spinner, switch thumb) are not tokens.
  radius: { control: "0.375rem", container: "0.5rem", small: "0.25rem", pill: "9999px" },
  // One width for every control and container outline (border-line utilities and the outline button's ring).
  borderWidth: "1px",
  // Control heights (h-control-md) and the inline padding steps that go with them.
  control: { sm: "1.75rem", md: "2.25rem", lg: "2.5rem" },
  padding: {
    control: { sm: "0.625rem", md: "0.875rem", lg: "1rem" },
    field: { sm: "0.5rem", md: "0.75rem", lg: "0.75rem" },
    container: { sm: "1rem", md: "1.25rem", lg: "1.5rem" },
  },

  // ---------------------------------------------------------------- surfaces
  // Shadow strings may use var(--shadow-color); they are re-declared per light/dark scope.
  // raised: resting surfaces (card). control: a control's own lift (the selected tab). overlay: popups, dialogs, drawers, toasts.
  shadows: {
    xs: "0 1px 2px var(--shadow-color)",
    sm: "0 1px 2px var(--shadow-color), 0 1px 3px var(--shadow-color)",
    md: "0 2px 4px -1px var(--shadow-color), 0 4px 8px -2px var(--shadow-color)",
    lg: "0 0 0 1px var(--shadow-color), 0 4px 8px -2px var(--shadow-color), 0 12px 24px -4px var(--shadow-color)",
    raised: "none",
    control: "none",
    overlay: "0 0 0 1px var(--shadow-color), 0 4px 8px -2px var(--shadow-color), 0 12px 24px -4px var(--shadow-color)",
  },
}
