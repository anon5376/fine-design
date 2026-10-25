import type { Metadata } from "next"
import type { ReactNode } from "react"
import tokens from "@/styles/tokens.json"
import { MotionDemo } from "@/site/motion-demo"

export const metadata: Metadata = { title: "Tokens" }

const RAMPS = ["gray", "blue", "red", "green", "amber"]
const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]
const SPACING = [1, 2, 3, 4, 6, 8, 12, 16, 24]
const semanticColors = Object.keys(tokens.semantic.light).filter(k => k !== "shadow-color")

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="grid grid-cols-1 gap-4">
      <h2 id={id} className="text-base font-medium">
        {title}
      </h2>
      {children}
    </section>
  )
}

const th = "border-b border-border px-3 py-2 text-left text-xs font-medium text-muted-foreground"
const thEnd = th.replace("text-left", "text-right")
const td = "border-b border-border px-3 py-2 align-middle"

export default function TokensPage() {
  return (
    <article className="grid grid-cols-1 gap-12">
      <h1 className="text-2xl font-medium tracking-tight">Tokens</h1>

      <Section id="semantic" title="Semantic colors">
        <div className="overflow-x-auto rounded-container border border-border">
          <table className="w-full min-w-md border-collapse text-sm">
            <thead>
              <tr>
                <th className={th}>Token</th>
                <th className={th}>Light</th>
                <th className={th}>Dark</th>
              </tr>
            </thead>
            <tbody>
              {semanticColors.map(name => (
                <tr key={name}>
                  <td className={`${td} font-mono text-xs`}>{name}</td>
                  {(["light", "dark"] as const).map(mode => (
                    <td key={mode} className={td}>
                      <div className="flex items-center gap-2">
                        <span className={`${mode} size-6 shrink-0 rounded-[0.25rem] border border-border`} style={{ background: `var(--${name})` }} />
                        <span className="font-mono text-xs text-muted-foreground">{tokens.semantic[mode][name as keyof typeof tokens.semantic.light]}</span>
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
          {RAMPS.map(ramp => (
            <div key={ramp} className="grid min-w-xl grid-cols-[4rem_repeat(11,minmax(0,1fr))] items-center gap-1">
              <span className="font-mono text-xs">{ramp}</span>
              {STEPS.map(step => (
                <div key={step} className="grid gap-1">
                  <span
                    className="h-8 rounded-[0.25rem] border border-border"
                    style={{ background: `var(--${ramp}-${step})` }}
                    title={tokens.primitives[`${ramp}-${step}` as keyof typeof tokens.primitives]}
                  />
                  <span className="figures text-center text-2xs text-muted-foreground">{step}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Section>

      <Section id="type" title="Type scale">
        <ul className="grid gap-3">
          {Object.entries(tokens.theme.text).map(([name, [size, lineHeight]]) => (
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

      <Section id="spacing" title="Spacing">
        <ul className="grid gap-2">
          {SPACING.map(n => (
            <li key={n} className="grid grid-cols-[5rem_minmax(0,1fr)] items-center gap-3">
              <span className="font-mono text-xs text-muted-foreground">
                {n} · {n * 4}px
              </span>
              <span className="h-3 rounded-[0.125rem] bg-primary" style={{ width: `calc(var(--spacing) * ${n})` }} />
            </li>
          ))}
        </ul>
      </Section>

      <Section id="shape" title="Radius and elevation">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] gap-4">
          {Object.keys(tokens.theme.radius).map(name => (
            <div key={name} className="grid gap-2">
              <span className="h-16 border border-border bg-surface" style={{ borderRadius: `var(--radius-${name})` }} />
              <span className="font-mono text-xs text-muted-foreground">radius-{name}</span>
            </div>
          ))}
          {["xs", "sm", "md", "lg", "raised", "overlay"].map(name => (
            <div key={name} className="grid gap-2">
              <span className="h-16 rounded-container bg-surface" style={{ boxShadow: `var(--shadow-${name})` }} />
              <span className="font-mono text-xs text-muted-foreground">shadow-{name}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section id="motion" title="Motion">
        <MotionDemo />
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className={th}>Tier</th>
              <th className={thEnd}>Enter spring</th>
              <th className={thEnd}>Exit tween</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(tokens.motion).map(([tier, m]) => (
              <tr key={tier}>
                <td className={`${td} font-mono text-xs`}>{tier}</td>
                <td className={`${td} figures text-right text-xs`}>
                  {m.duration * 1000}ms · bounce {m.bounce}
                </td>
                <td className={`${td} figures text-right text-xs`}>{m.exit * 1000}ms</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section id="scalars" title="Layers, borders, breakpoints">
        <dl className="grid grid-cols-[repeat(auto-fill,minmax(12rem,1fr))] gap-x-6 gap-y-2 font-mono text-xs">
          {[...Object.entries(tokens.scalars).filter(([k]) => !k.startsWith("font") && !k.startsWith("duration")), ...Object.entries(tokens.theme.breakpoint).map(([k, v]) => [`breakpoint-${k}`, v])].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3 border-b border-border py-1">
              <dt>{k}</dt>
              <dd className="text-muted-foreground">{v}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section id="contrast" title="Contrast">
        <div className="max-h-[32rem] overflow-auto rounded-container border border-border" tabIndex={0} role="region" aria-label="Contrast report">
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
              {tokens.contrast.map(r => (
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
    </article>
  )
}
