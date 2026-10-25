import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { cn } from "@/lib/utils"
import { Code } from "@/site/example"
import { InstallCommand } from "@/site/install-command"
import { blocks, type BlockFrame } from "@/site/nav"
import { parseExamples, readSource } from "@/site/source"

const frames: Record<BlockFrame, string> = {
  center: "flex min-h-96 items-center justify-center p-6",
  full: "overflow-hidden",
  app: "h-[44rem] overflow-hidden",
}

type Props = { params: Promise<{ slug: string }> }

export const dynamicParams = false

export function generateStaticParams() {
  return blocks.map(b => ({ slug: b.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  return { title: blocks.find(b => b.slug === slug)?.title }
}

export default async function BlockPage({ params }: Props) {
  const { slug } = await params
  const entry = blocks.find(b => b.slug === slug)
  if (!entry) notFound()
  const [mod, source, examples, exampleSource] = await Promise.all([
    entry.load(),
    readSource(`components/blocks/${slug}.tsx`),
    entry.examples(),
    readSource(`site/examples/block-${slug}.tsx`),
  ])
  const Block = mod[entry.exportName]
  const frame = cn("rounded-container border-line border-border bg-background", frames[entry.frame ?? "center"])

  return (
    <article className="grid grid-cols-1 gap-8">
      <header className="grid grid-cols-1 gap-4">
        <h1 className="font-display text-2xl font-title tracking-tight">{entry.title}</h1>
        <InstallCommand name={slug} />
      </header>
      <div className={frame}>
        <Block />
      </div>
      <Code code={source} />
      {parseExamples(exampleSource).map(ex => {
        const Live = examples[ex.name]
        return (
          <section key={ex.name} aria-labelledby={`example-${ex.name}`} className="grid grid-cols-1 gap-3">
            <h2 id={`example-${ex.name}`} className="font-display text-base font-title">
              {ex.title}
            </h2>
            <div className={frame}>
              <Live />
            </div>
            <Code code={ex.code} />
          </section>
        )
      })}
    </article>
  )
}
