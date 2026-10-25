import type { Metadata } from "next"
import tokens from "@/styles/tokens.json"
import { MotionDemo } from "@/site/motion-demo"
import { presets as docsPresets } from "@/site/presets"
import { PresetTokens, type PresetData } from "@/site/preset-tokens"
import { Section, td, th, thEnd } from "@/site/tokens-ui"

export const metadata: Metadata = { title: "Tokens" }

const SPACING = [1, 2, 3, 4, 6, 8, 12, 16, 24]

// Each preset's slice, in the docs' preset order (Ledger first, the default): the page ships what it shows, not the whole token file.
const presets: Record<string, PresetData> = Object.fromEntries(
  docsPresets.map(({ id }) => {
    const p = tokens.presets[id as keyof typeof tokens.presets]
    const { primitives, semantic, fonts, weights, radii, borderWidth, control, padding, shadows, contrast } = p
    return [id, { primitives, semantic, text: p.theme.text, fonts, weights, radii, borderWidth, control, padding, shadows, contrast }]
  }),
)

export default function TokensPage() {
  return (
    <article className="grid grid-cols-1 gap-12">
      <h1 className="font-display text-2xl font-title tracking-tight">Tokens</h1>

      <PresetTokens presets={presets}>
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
              <div key={k} className="flex justify-between gap-3 border-b-line border-border py-1">
                <dt>{k}</dt>
                <dd className="text-muted-foreground">{v}</dd>
              </div>
            ))}
          </dl>
        </Section>
      </PresetTokens>
    </article>
  )
}
