// The docs' presets and the fonts each one needs. One section per preset; a preset agent edits only its own.
//
// To give a preset its own faces:
//   1. Declare the loaders in its section: `const x = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", preload: false })`.
//      The variable must be the one its scripts/presets/<id>.mjs fonts.* reads, as var(--font-fraunces, "Fraunces").
//      An `axes` (variable font) or `weight` (fixed-weight font) option must match the preset's fontOptions for that variable,
//      which is what theme meta.fonts carries to installed projects.
//      preload: false keeps a non-default preset's files off every other preset's pages; they load when first used.
//   2. List the loaders in `fonts` of its entry.
// scripts/registry.mjs fails the build when a preset reads a font variable that no loader here declares, or declares other axes or weights.
import { Geist, Geist_Mono, Source_Sans_3, Newsreader, Spline_Sans_Mono, Bricolage_Grotesque, Instrument_Sans, Martian_Mono } from "next/font/google"

type Preset = { id: string; label: string; fonts: { variable: string }[] }

// ---------------------------------------------------------------- ledger (the default: no data-preset attribute)

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" })

const ledger: Preset = { id: "ledger", label: "Ledger", fonts: [geistSans, geistMono] }

// ---------------------------------------------------------------- folio

// opsz lets the browser pick Newsreader's display cut at large sizes (font-optical-sizing is auto).
const newsreader = Newsreader({ subsets: ["latin"], axes: ["opsz"], variable: "--font-newsreader", preload: false })
const sourceSans = Source_Sans_3({ subsets: ["latin"], variable: "--font-source-sans", preload: false })
const splineSansMono = Spline_Sans_Mono({ subsets: ["latin"], variable: "--font-spline-sans-mono", preload: false })

const folio: Preset = { id: "folio", label: "Folio", fonts: [newsreader, sourceSans, splineSansMono] }

// ---------------------------------------------------------------- poster

// opsz lets Bricolage switch to its condensed, high-contrast display cut at poster sizes (font-optical-sizing is auto).
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], axes: ["opsz"], variable: "--font-bricolage", preload: false })
const instrumentSans = Instrument_Sans({ subsets: ["latin"], variable: "--font-instrument-sans", preload: false })
const martianMono = Martian_Mono({ subsets: ["latin"], variable: "--font-martian-mono", preload: false })

const poster: Preset = { id: "poster", label: "Poster", fonts: [bricolage, instrumentSans, martianMono] }

// ---------------------------------------------------------------- shared

/** In display order. The first is the default and is shown by the absence of data-preset. */
export const presets: Preset[] = [ledger, folio, poster]

/** Classes for <html>: each font's CSS variable, once. */
export const fontClassName = [...new Set(presets.flatMap(p => p.fonts.map(f => f.variable)))].join(" ")
