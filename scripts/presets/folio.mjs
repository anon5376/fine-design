// Folio: an editorial publication. Newsreader headings, Source Sans 3 for body and UI, warm paper and warm ink,
// one aubergine accent on its own ramp (danger stays red), square corners, hairline rules, roomy controls, nothing raised at rest.
// The shape is the same as ledger.mjs, and every key is required (tokens.mjs names the preset and the key it is
// missing). Behavior (roles, keyboard, focus, validation, reduced motion, motion tiers) is not a preset concern.
// Sections in order: palette, semantic, fonts, weights, sizes (text), shape (radius, border, control, padding), surfaces (shadows).
export default {
  name: "folio",

  // ---------------------------------------------------------------- palette
  // Ramp parameters, not colors: tokens.mjs turns them into OKLCH primitives clamped to sRGB.
  palette: {
    // Paper and ink, warm throughout. 100 is the page, 50 the stock a surface is printed on, 200 and 300 the rules.
    grayHue: 80,
    gray: {
      50: [0.987, 0.006], 100: [0.965, 0.013], 200: [0.93, 0.017], 300: [0.875, 0.02],
      400: [0.74, 0.02], 500: [0.6, 0.02], 600: [0.5, 0.02], 700: [0.4, 0.018],
      800: [0.305, 0.014], 900: [0.26, 0.012], 950: [0.215, 0.011],
    },
    // Muted pigments that sit on paper. plum is the accent's own ramp, 40 degrees or more from red, so the accent can
    // never read as danger (the gate in tokens.mjs fails a preset where it does).
    lightness: { 50: 0.975, 100: 0.945, 200: 0.89, 300: 0.82, 400: 0.73, 500: 0.64, 600: 0.55, 700: 0.47, 800: 0.4, 900: 0.33, 950: 0.26 },
    chroma: { 50: 0.08, 100: 0.17, 200: 0.33, 300: 0.55, 400: 0.78, 500: 0.93, 600: 1, 700: 0.94, 800: 0.82, 900: 0.66, 950: 0.5 },
    hues: {
      blue: { hue: 245, peak: 0.09 },
      red: { hue: 22, peak: 0.17 },
      green: { hue: 155, peak: 0.11 },
      amber: { hue: 78, peak: 0.12 },
      plum: { hue: 320, peak: 0.12 },
    },
  },

  // A string names a primitive. { mix, pct } is a translucent overlay:
  // color-mix(in oklch, var(--mix) pct%, transparent).
  semantic: {
    light: {
      background: "gray-100", foreground: "gray-950", surface: "gray-50",
      muted: "gray-200", "muted-foreground": "gray-600",
      border: "gray-300", input: "gray-500", ring: "gray-950",
      primary: "gray-900", "primary-foreground": "gray-50", "primary-hover": "gray-800", "primary-active": "gray-700",
      secondary: "gray-200", "secondary-foreground": "gray-900", "secondary-hover": "gray-300", "secondary-active": "gray-300",
      // Aubergine: the one hue on a page, for the main element (a chart's current series, a selected value). Never chrome.
      accent: "plum-800", "accent-foreground": "gray-50",
      success: "green-700", "success-foreground": "gray-50", "success-subtle": "green-50", "success-subtle-foreground": "green-800",
      warning: "amber-400", "warning-foreground": "amber-950", "warning-subtle": "amber-50", "warning-subtle-foreground": "amber-800",
      danger: "red-600", "danger-foreground": "gray-50", "danger-hover": "red-700", "danger-active": "red-800", "danger-subtle": "red-50", "danger-subtle-foreground": "red-700",
      info: "blue-700", "info-foreground": "gray-50", "info-subtle": "blue-50", "info-subtle-foreground": "blue-800",
      hover: { mix: "gray-900", pct: 5 }, active: { mix: "gray-900", pct: 9 },
      overlay: { mix: "gray-950", pct: 45 }, "shadow-color": { mix: "gray-950", pct: 9 },
    },
    // Night reading: warm charcoal, cream text, a lifted plum. Not Ledger inverted.
    dark: {
      background: "gray-950", foreground: "gray-200", surface: "gray-900",
      muted: "gray-800", "muted-foreground": "gray-400",
      border: "gray-800", input: "gray-500", ring: "gray-200",
      primary: "gray-200", "primary-foreground": "gray-950", "primary-hover": "gray-100", "primary-active": "gray-300",
      secondary: "gray-800", "secondary-foreground": "gray-200", "secondary-hover": "gray-700", "secondary-active": "gray-600",
      accent: "plum-400", "accent-foreground": "gray-950",
      success: "green-700", "success-foreground": "gray-50", "success-subtle": "green-950", "success-subtle-foreground": "green-300",
      warning: "amber-400", "warning-foreground": "amber-950", "warning-subtle": "amber-950", "warning-subtle-foreground": "amber-300",
      danger: "red-600", "danger-foreground": "gray-50", "danger-hover": "red-700", "danger-active": "red-800", "danger-subtle": "red-950", "danger-subtle-foreground": "red-300",
      info: "blue-600", "info-foreground": "gray-50", "info-subtle": "blue-950", "info-subtle-foreground": "blue-300",
      hover: { mix: "gray-100", pct: 6 }, active: { mix: "gray-100", pct: 10 },
      overlay: { mix: "black", pct: 60 }, "shadow-color": { mix: "black", pct: 45 },
    },
  },

  // ---------------------------------------------------------------- fonts
  // Newsreader (display optical size) for headings, Source Sans 3 for body and UI, Spline Sans Mono for code.
  // Figures stay in the sans: its tabular digits align columns, and a serif or mono in a price row breaks the baseline.
  fonts: {
    sans: 'var(--font-source-sans, "Source Sans 3"), ui-sans-serif, system-ui, sans-serif',
    mono: 'var(--font-spline-sans-mono, "Spline Sans Mono"), ui-monospace, SFMono-Regular, monospace',
    heading: 'var(--font-newsreader, "Newsreader"), ui-serif, Georgia, serif',
    figure: "var(--font-sans)",
  },
  // Optional next/font options per face, keyed by its CSS variable (`axes` for a variable font, or `weights` for a fixed-weight one).
  // They ride along in the theme's meta.fonts so an installed project loads the face as the docs do; site/presets.ts must pass the same.
  // opsz lets the browser pick Newsreader's display cut at large sizes.
  fontOptions: { "--font-newsreader": { axes: ["opsz"] } },

  // ---------------------------------------------------------------- weights
  // Serif titles stay light; the hierarchy comes from size and the face, not from weight.
  weights: { label: 500, title: 400, strong: 500 },

  // ---------------------------------------------------------------- sizes
  // A larger, slower scale than Ledger: body sits at 15px, display runs big and tight.
  text: {
    "2xs": ["0.6875rem", "1rem", "0.04em"], xs: ["0.75rem", "1.125rem", "0.02em"], sm: ["0.96875rem", "1.45rem"], base: ["1.0625rem", "1.7rem"],
    lg: ["1.1875rem", "1.8rem"], xl: ["1.375rem", "1.9rem", "-0.005em"], "2xl": ["1.75rem", "2.15rem", "-0.01em"],
    "3xl": ["2.25rem", "2.6rem", "-0.015em"], "4xl": ["2.875rem", "3.1rem", "-0.02em"],
    "5xl": ["3.875rem", "1.04", "-0.025em"], "6xl": ["5rem", "1", "-0.03em"],
  },

  // ---------------------------------------------------------------- shape
  radius: { control: "0.125rem", container: "0.125rem", small: "0.0625rem", pill: "0.125rem" },
  borderWidth: "1px",
  control: { sm: "2rem", md: "2.75rem", lg: "3.25rem" },
  padding: {
    control: { sm: "0.875rem", md: "1.25rem", lg: "1.75rem" },
    field: { sm: "0.75rem", md: "1rem", lg: "1.25rem" },
    container: { sm: "1.25rem", md: "2rem", lg: "2.5rem" },
  },

  // ---------------------------------------------------------------- surfaces
  // Nothing is raised at rest, and no control lifts. Overlays are cut out of the page by a hairline (the border color) and a long, soft shadow.
  shadows: {
    xs: "0 1px 1px var(--shadow-color)",
    sm: "0 1px 2px var(--shadow-color)",
    md: "0 4px 12px -4px var(--shadow-color)",
    lg: "0 0 0 1px var(--border), 0 2px 4px var(--shadow-color), 0 18px 40px -12px var(--shadow-color)",
    raised: "none",
    control: "none",
    overlay: "0 0 0 1px var(--border), 0 2px 4px var(--shadow-color), 0 18px 40px -12px var(--shadow-color)",
  },
}
