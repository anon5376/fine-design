import type { ReactNode } from "react"

export function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="grid grid-cols-1 gap-4">
      <h2 id={id} className="font-display text-base font-title">
        {title}
      </h2>
      {children}
    </section>
  )
}

export const th = "border-b-line border-border px-3 py-2 text-left text-xs font-label text-muted-foreground"
export const thEnd = th.replace("text-left", "text-right")
export const td = "border-b-line border-border px-3 py-2 align-middle"
