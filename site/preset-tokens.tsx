"use client"

import type { ReactNode } from "react"
import { Section, td, th, thEnd } from "@/site/tokens-ui"
import { usePreset } from "@/site/use-preset"

/** One preset's slice of styles/tokens.json: what the page lists for it. */
export type PresetData = {
  primitives: Record<string, string>
  semantic: Record<"light" | "dark", Record<string, string>>
  text: Record<string, string[]>
  fonts: Record<"sans" | "mono" | "heading" | "figure", string>
  weights: Record<"label" | "title" | "strong", number>
  radii: Record<string, string>
  borderWidth: string
  control: Record<string, string>
  padding: Record<string, Record<string, string>>
  shadows: Record<string, string>
  contrast: { mode: string; fg: string; bg: string; ratio: number; min: number; pass: boolean }[]
}

const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]

// Utilities are written out so Tailwind sees them; the key reads the value from the preset.
const FONTS = [
  { token: "font-sans", key: "sans", className: "font-sans", sample: "Quarterly revenue grew 18%" },
  { token: "font-display", key: "heading", className: "font-display", sample: "Quarterly revenue grew 18%" },
  { token: "font-mono", key: "mono", className: "font-mono", sample: "npx shadcn@latest add" },
  { token: "font-figure", key: "figure", className: "figures", sample: "$248,630.42" },
] as const

const WEIGHTS = [
  { name: "label", className: "font-label", sample: "Send transfer" },
  { name: "title", className: "font-title", sample: "Quarterly revenue" },
  { name: "strong", className: "font-strong", sample: "Ledgerly" },
] as const

const CONTROLS = { sm: "h-control-sm", md: "h-control-md", lg: "h-control-lg" } as const

const mono = "font-mono text-xs text-muted-foreground"

// `var(--font-newsreader, "Newsreader"), ui-serif` reads as `"Newsreader", ui-serif`.
const family = (value: string) => value.replace(/var\(--[\w-]+, ("[^"]+")\)/g, "$1")

type Row = { token: string; sample: ReactNode; value: string }

function SpecTable({ id, title, rows }: { id: string; title: string; rows: Row[] }) {
  return (
    <Section id={id} title={title}>
      <div className="overflow-x-auto rounded-container border-line border-border">
        <table className="w-full min-w-md border-collapse text-sm">
          <thead>
            <tr>
              <th className={th}>Token</th>
              <th className={th}>Sample</th>
              <th className={th}>Value</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.token}>
                <td className={`${td} font-mono text-xs`}>{r.token}</td>
                <td className={td}>{r.sample}</td>
                <td className={`${td} ${mono}`}>{r.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  )
}

/**
 * The active preset's values (data-preset on <html>), then `children`, the sections every preset shares.
 * It renders the Ledger values until hydration, as the preset select does. Swatches and specimens use the live
 * variables and utilities, so what is drawn always matches the preset; the text comes from tokens.json.
 */
export function PresetTokens({ presets, children }: { presets: Record<string, PresetData>; children: ReactNode }) {
  const p = presets[usePreset(Object.keys(presets))]
  const ramps = [...new Set(Object.keys(p.primitives).flatMap(k => (/-\d+$/.test(k) ? [k.replace(/-\d+$/, "")] : [])))]
  const names = Object.keys(p.semantic.light).filter(k => k !== "shadow-color")

  return (
    <>
      <Section id="semantic" title="Semantic colors">
        <div className="overflow-x-auto rounded-container border-line border-border">
          <table className="w-full min-w-md border-collapse text-sm">
            <thead>
              <tr>
                <th className={th}>Token</th>
                <th className={th}>Light</th>
                <th className={th}>Dark</th>
              </tr>
            </thead>
            <tbody>
              {names.map(name => (
                <tr key={name}>
                  <td className={`${td} font-mono text-xs`}>{name}</td>
                  {(["light", "dark"] as const).map(mode => (
                    <td key={mode} className={td}>
                      <div className="flex items-center gap-2">
                        <span className={`${mode} size-6 shrink-0 rounded-small border-line border-border`} style={{ background: `var(--${name})` }} />
                        <span className={mono}>{p.semantic[mode][name]}</span>
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="primitives" title="Color ramps">
        <div className="grid gap-3 overflow-x-auto">
          {ramps.map(ramp => (
            <div key={ramp} className="grid min-w-xl grid-cols-[4rem_repeat(11,minmax(0,1fr))] items-center gap-1">
              <span className="font-mono text-xs">{ramp}</span>
              {STEPS.map(step => (
                <div key={step} className="grid gap-1">
                  <span className="h-8 rounded-small border-line border-border" style={{ background: `var(--${ramp}-${step})` }} title={p.primitives[`${ramp}-${step}`]} />
                  <span className="figures text-center text-2xs text-muted-foreground">{step}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Section>

      <SpecTable
        id="fonts"
        title="Fonts"
        rows={FONTS.map(f => ({ token: f.token, sample: <span className={`whitespace-nowrap text-base ${f.className}`}>{f.sample}</span>, value: family(p.fonts[f.key]) }))}
      />

      <SpecTable
        id="weights"
        title="Weights"
        rows={WEIGHTS.map(w => ({ token: `weight-${w.name}`, sample: <span className={`text-base ${w.className}`}>{w.sample}</span>, value: String(p.weights[w.name]) }))}
      />

      <Section id="type" title="Type scale">
        <ul className="grid gap-3">
          {Object.entries(p.text).map(([name, [size, lineHeight]]) => (
            <li key={name} className="grid grid-cols-[5rem_minmax(0,1fr)] items-baseline gap-3">
              <span className="font-mono text-xs text-muted-foreground">
                {name} · {size}/{lineHeight}
              </span>
              <span className="truncate" style={{ fontSize: `var(--text-${name})`, lineHeight: `var(--text-${name}--line-height)`, letterSpacing: `var(--text-${name}--letter-spacing, normal)` }}>
                Quarterly revenue grew 18%
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <SpecTable
        id="control"
        title="Control size"
        rows={(Object.keys(CONTROLS) as (keyof typeof CONTROLS)[]).map(size => ({
          token: `control-${size}`,
          sample: <span className={`block w-40 rounded-control border-line border-input bg-surface ${CONTROLS[size]}`} />,
          value: p.control[size],
        }))}
      />

      <SpecTable
        id="padding"
        title="Padding"
        rows={Object.entries(p.padding).flatMap(([group, steps]) =>
          Object.entries(steps).map(([step, value]) => ({
            token: `pad-${group}-${step}`,
            sample: <span className="block h-3 rounded-small bg-primary" style={{ width: `var(--pad-${group}-${step})` }} />,
            value,
          })),
        )}
      />

      <Section id="shape" title="Border and radius">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] gap-4">
          <div className="grid gap-2">
            <span className="h-16 rounded-none border-line border-foreground bg-surface" />
            <span className="grid font-mono text-xs text-muted-foreground">
              border-width
              <span>{p.borderWidth}</span>
            </span>
          </div>
          {Object.entries(p.radii).map(([name, value]) => (
            <div key={name} className="grid gap-2">
              <span className="h-16 border-line border-border bg-surface" style={{ borderRadius: `var(--radius-${name})` }} />
              <span className="grid font-mono text-xs text-muted-foreground">
                radius-{name}
                <span>{value}</span>
              </span>
            </div>
          ))}
        </div>
      </Section>

      {/* The preset's value, not var(--shadow-*): Tailwind drops xs, sm and md from the stylesheet when no utility uses them. */}
      <SpecTable
        id="shadows"
        title="Shadows"
        rows={Object.entries(p.shadows).map(([name, value]) => ({
          token: `shadow-${name}`,
          sample: <span className="my-2 block h-10 w-24 rounded-container bg-surface" style={{ boxShadow: value }} />,
          value,
        }))}
      />

      <Section id="contrast" title="Contrast">
        <div className="max-h-[32rem] overflow-auto rounded-container border-line border-border" tabIndex={0} role="region" aria-label="Contrast report">
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 bg-surface">
              <tr>
                <th className={th}>Mode</th>
                <th className={th}>Text</th>
                <th className={th}>Background</th>
                <th className={thEnd}>Ratio</th>
                <th className={thEnd}>Min</th>
              </tr>
            </thead>
            <tbody>
              {p.contrast.map(r => (
                <tr key={`${r.mode}-${r.fg}-${r.bg}`}>
                  <td className={td}>{r.mode}</td>
                  <td className={`${td} font-mono text-xs`}>{r.fg}</td>
                  <td className={`${td} font-mono text-xs`}>{r.bg}</td>
                  <td className={`${td} figures text-right text-xs ${r.pass ? "" : "text-danger-subtle-foreground"}`}>{r.ratio.toFixed(2)}</td>
                  <td className={`${td} figures text-right text-xs text-muted-foreground`}>{r.min}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {children}
    </>
  )
}
