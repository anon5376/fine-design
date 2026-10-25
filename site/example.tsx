import type { ReactNode } from "react"
import { CopyButton } from "@/site/copy-button"

export function Example({ title, code, children, id }: { title: string; code: string; children: ReactNode; id: string }) {
  return (
    <section aria-labelledby={id} className="grid grid-cols-1 gap-3">
      <h2 id={id} className="font-display text-base font-title">
        {title}
      </h2>
      <div className="flex min-h-32 flex-wrap items-center justify-center gap-3 rounded-container border-line border-border bg-background p-6">
        {children}
      </div>
      <Code code={code} />
    </section>
  )
}

export function Code({ code }: { code: string }) {
  return (
    <div className="relative rounded-container border-line border-border bg-muted pr-10">
      <div className="absolute top-2 right-2">
        <CopyButton text={code} />
      </div>
      <pre tabIndex={0} className="max-h-96 overflow-auto p-4 font-mono text-xs leading-5">
        <code>{code}</code>
      </pre>
    </div>
  )
}
