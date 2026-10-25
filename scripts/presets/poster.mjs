// Poster: an event, gallery or label site. Bricolage Grotesque headings, Instrument Sans for body and UI, Martian Mono
// for figures, stark paper and indigo-black ink, one flat hot magenta (primary and accent, on its own ramp; danger stays
// tomato red), chunky pill controls, 2px ink outlines and hard offset shadows. The shape is the same as ledger.mjs, and every key is required (tokens.mjs names the preset and the
// key it is missing). Behavior (roles, keyboard, focus, validation, reduced motion, motion tiers) is not a preset concern.
// Sections in order: palette, semantic, fonts, weights, sizes (text), shape (radius, border, control, padding), surfaces (shadows).
export default {
  name: "poster",

  // ---------------------------------------------------------------- palette
  // Ramp parameters, not colors: tokens.mjs turns them into OKLCH primitives clamped to sRGB.
  palette: {
    // Paper and ink. The light steps are almost white; the dark steps carry an indigo cast, so 950 is a printed black
    // rather than a screen grey. 50 is the page, white the stock a card is printed on, 950 the ink.
    grayHue: 285,
    gray: {
      50: [0.985, 0.004], 100: [0.958, 0.009], 200: [0.918, 0.016], 300: [0.85, 0.024],
      400: [0.72, 0.03], 500: [0.58, 0.034], 600: [0.48, 0.034], 700: [0.38, 0.034],
      800: [0.29, 0.03], 900: [0.215, 0.028], 950: [0.155, 0.026],
    },
    // Hue ramps share one lightness ladder and one chroma curve; chroma is clamped to the sRGB gamut.
    // red is tomato and is only ever danger: 700 the fill, 800 and 900 its hover and press.
    // magenta is the signature, flat and never a gradient: 600 is primary and accent in light mode (white text on it),
    // 400 in dark mode (ink text on it), and the ramp supplies the hover and press steps. Its hue is 40 degrees or more
    // from red, which the gate in tokens.mjs enforces.
    lightness: { 50: 0.975, 100: 0.945, 200: 0.89, 300: 0.82, 400: 0.73, 500: 0.64, 600: 0.55, 700: 0.47, 800: 0.4, 900: 0.33, 950: 0.26 },
    chroma: { 50: 0.08, 100: 0.17, 200: 0.33, 300: 0.55, 400: 0.78, 500: 0.93, 600: 1, 700: 0.94, 800: 0.82, 900: 0.66, 950: 0.5 },
    hues: {
      blue: { hue: 262, peak: 0.19 },
      red: { hue: 31, peak: 0.23 },
      green: { hue: 152, peak: 0.17 },
      amber: { hue: 88, peak: 0.17 },
      magenta: { hue: 345, peak: 0.22 },
    },
  },

  // A string names a primitive. { mix, pct } is a translucent overlay:
  // color-mix(in oklch, var(--mix) pct%, transparent).
  semantic: {
    light: {
      background: "gray-50", foreground: "gray-950", surface: "white",
      muted: "gray-100", "muted-foreground": "gray-600",
      border: "gray-950", input: "gray-950", ring: "gray-950",
      primary: "magenta-600", "primary-foreground": "white", "primary-hover": "magenta-700", "primary-active": "magenta-800",
      secondary: "gray-200", "secondary-foreground": "gray-950", "secondary-hover": "gray-300", "secondary-active": "gray-300",
      // The signature magenta again, for the main data element (a chart's current series, a selected value).
      accent: "magenta-600", "accent-foreground": "white",
      success: "green-700", "success-foreground": "white", "success-subtle": "green-50", "success-subtle-foreground": "green-700",
      warning: "amber-400", "warning-foreground": "amber-950", "warning-subtle": "amber-50", "warning-subtle-foreground": "amber-800",
      danger: "red-700", "danger-foreground": "white", "danger-hover": "red-800", "danger-active": "red-900", "danger-subtle": "red-50", "danger-subtle-foreground": "red-800",
      info: "blue-600", "info-foreground": "white", "info-subtle": "blue-50", "info-subtle-foreground": "blue-700",
      hover: { mix: "gray-950", pct: 6 }, active: { mix: "gray-950", pct: 11 },
      // Solid ink: the offset shadows are printed, not blurred.
      overlay: { mix: "gray-950", pct: 55 }, "shadow-color": "gray-950",
    },
    dark: {
      background: "gray-950", foreground: "gray-50", surface: "gray-900",
      muted: "gray-800", "muted-foreground": "gray-400",
      border: "gray-600", input: "gray-500", ring: "gray-50",
      // Lighter magenta with ink text; hover and press go lighter still, since ink on a darker step falls under 4.5:1.
      primary: "magenta-400", "primary-foreground": "gray-950", "primary-hover": "magenta-300", "primary-active": "magenta-200",
      secondary: "gray-800", "secondary-foreground": "gray-50", "secondary-hover": "gray-700", "secondary-active": "gray-600",
      accent: "magenta-400", "accent-foreground": "gray-950",
      success: "green-700", "success-foreground": "white", "success-subtle": "green-950", "success-subtle-foreground": "green-300",
      warning: "amber-400", "warning-foreground": "amber-950", "warning-subtle": "amber-950", "warning-subtle-foreground": "amber-300",
      danger: "red-700", "danger-foreground": "white", "danger-hover": "red-800", "danger-active": "red-900", "danger-subtle": "red-950", "danger-subtle-foreground": "red-300",
      info: "blue-600", "info-foreground": "white", "info-subtle": "blue-950", "info-subtle-foreground": "blue-300",
      hover: { mix: "gray-50", pct: 8 }, active: { mix: "gray-50", pct: 13 },
      // Ink on ink would vanish, so the offset shadow is a lifted ink: the border's colour, a thicker edge rather than a second hue.
      overlay: { mix: "black", pct: 65 }, "shadow-color": "gray-600",
    },
  },

  // ---------------------------------------------------------------- fonts
  // sans: body and UI. heading: Heading, card/dialog/drawer titles. mono: code. figure: money, counts, IDs (the `figures` utility).
  fonts: {
    sans: 'var(--font-instrument-sans, "Instrument Sans"), ui-sans-serif, system-ui, sans-serif',
    mono: 'var(--font-martian-mono, "Martian Mono"), ui-monospace, SFMono-Regular, monospace',
    heading: 'var(--font-bricolage, "Bricolage Grotesque"), var(--font-sans)',
    figure: "var(--font-mono)",
  },
  // Optional next/font options per face, keyed by its CSS variable (`axes` for a variable font, or `weights` for a fixed-weight one).
  // They ride along in the theme's meta.fonts so an installed project loads the face as the docs do; site/presets.ts must pass the same.
  // opsz lets Bricolage switch to its condensed, high-contrast display cut at poster sizes.
  fontOptions: { "--font-bricolage": { axes: ["opsz"] } },

  // Widest digit or money glyph ($ , . + −) of the figure face, in em. `figure-fit` sizes a stat from it, and
  // tests/layout.spec.ts fails a value below what the face measures.
  figureAdvance: 0.7,

  // ---------------------------------------------------------------- weights
  // label: buttons, control and field labels, tabs, table heads. title: Heading and in-flow titles.
  // strong: container titles (card, dialog, drawer) and the wordmark.
  weights: { label: 600, title: 700, strong: 800 },

  // ---------------------------------------------------------------- sizes
  // Type scale: [size, line-height, letter-spacing?].
  text: {
    "2xs": ["0.6875rem", "1rem"], xs: ["0.78125rem", "1.125rem"], sm: ["0.9375rem", "1.375rem"], base: ["1.0625rem", "1.625rem"],
    lg: ["1.25rem", "1.75rem"], xl: ["1.5rem", "1.875rem", "-0.015em"], "2xl": ["1.875rem", "2.125rem", "-0.025em"],
    "3xl": ["2.375rem", "2.5rem", "-0.03em"], "4xl": ["3.125rem", "3.125rem", "-0.035em"],
    "5xl": ["4.25rem", "1", "-0.045em"], "6xl": ["5.5rem", "0.95", "-0.05em"],
  },

  // ---------------------------------------------------------------- shape
  // small: marks inside a control (checkbox box, kbd, tag remove). Circles (avatar, spinner, switch thumb) are not tokens.
  // 1.5rem makes a pill of any control up to 3rem tall and a soft corner on a tall one (textarea, card), without 9999px stretching a textarea into a capsule.
  radius: { control: "1.5rem", container: "1.5rem", small: "0.375rem", pill: "9999px" },
  // One width for every control and container outline (border-line utilities and the outline button's ring).
  borderWidth: "2px",
  // Control heights (h-control-md) and the inline padding steps that go with them.
  control: { sm: "2.25rem", md: "3rem", lg: "3.5rem" },
  padding: {
    control: { sm: "0.875rem", md: "1.25rem", lg: "1.75rem" },
    field: { sm: "0.875rem", md: "1.25rem", lg: "1.5rem" },
    container: { sm: "1.25rem", md: "1.75rem", lg: "2.25rem" },
  },

  // ---------------------------------------------------------------- surfaces
  // Shadow strings may use var(--shadow-color); they are re-declared per light/dark scope.
  // raised: resting surfaces (card). control: a control's own lift (the selected tab); none, because a hard offset
  // reads as a crescent under a pill. overlay: popups, dialogs, drawers, toasts.
  shadows: {
    xs: "2px 2px 0 0 var(--shadow-color)",
    sm: "3px 3px 0 0 var(--shadow-color)",
    md: "4px 4px 0 0 var(--shadow-color)",
    lg: "6px 6px 0 0 var(--shadow-color)",
    raised: "4px 4px 0 0 var(--shadow-color)",
    control: "none",
    overlay: "6px 6px 0 0 var(--shadow-color)",
  },
}
