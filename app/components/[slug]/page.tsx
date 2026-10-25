import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Example } from "@/site/example"
import { InstallCommand } from "@/site/install-command"
import { components } from "@/site/nav"
import { parseExamples, readSource } from "@/site/source"

type Props = { params: Promise<{ slug: string }> }

export const dynamicParams = false

export function generateStaticParams() {
  return components.map(c => ({ slug: c.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  return { title: components.find(c => c.slug === slug)?.title }
}

export default async function ComponentPage({ params }: Props) {
  const { slug } = await params
  const entry = components.find(c => c.slug === slug)
  if (!entry) notFound()
  const [mod, source] = await Promise.all([entry.load(), readSource(`site/examples/${slug}.tsx`)])

  return (
    <article className="grid grid-cols-1 gap-10">
      <header className="grid grid-cols-1 gap-4">
        <h1 className="font-display text-2xl font-title tracking-tight">{entry.title}</h1>
        <InstallCommand name={slug} />
      </header>
      {parseExamples(source).map(ex => {
        const Live = mod[ex.name]
        return (
          <Example key={ex.name} id={`example-${ex.name}`} title={ex.title} code={ex.code}>
            <Live />
          </Example>
        )
      })}
    </article>
  )
}
