import Link from "next/link"
import { blocks, components } from "@/site/nav"

const credits = [
  { name: "Fluid Functionalism", href: "https://github.com/mickadesign/fluid-functionalism" },
  { name: "Rare UI", href: "https://rareui.com" },
  { name: "easyui", href: "https://easyui.site" },
  { name: "taste-skill", href: "https://github.com/Leonxlnx/taste-skill" },
  { name: "Base UI", href: "https://github.com/mui/base-ui" },
]

const cardLink =
  "rounded-container border border-border bg-surface px-4 py-3 font-medium transition-colors duration-(--duration-fast) hover:bg-muted"

export default function Home() {
  return (
    <div className="grid grid-cols-1 gap-10">
      <section aria-labelledby="components" className="grid gap-4">
        <h1 id="components" className="text-2xl font-medium tracking-tight">
          Components
        </h1>
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-3">
          {components.map(c => (
            <li key={c.slug} className="grid">
              <Link href={`/components/${c.slug}/`} className={cardLink}>
                {c.title}
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="blocks" className="grid gap-4">
        <h2 id="blocks" className="text-base font-medium">
          Blocks
        </h2>
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-3">
          {blocks.map(b => (
            <li key={b.slug} className="grid">
              <Link href={`/blocks/${b.slug}/`} className={cardLink}>
                {b.title}
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="credits" className="grid gap-4">
        <h2 id="credits" className="text-base font-medium">
          Credits
        </h2>
        <ul className="flex flex-wrap gap-x-5 gap-y-2 text-muted-foreground">
          {credits.map(c => (
            <li key={c.href}>
              <a href={c.href} className="rounded-control underline underline-offset-4 transition-colors duration-(--duration-fast) hover:text-foreground">
                {c.name}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
