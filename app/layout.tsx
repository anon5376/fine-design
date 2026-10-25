import type { Metadata } from "next"
import type { ReactNode } from "react"
import Link from "next/link"
import { PresetSwitch } from "@/site/preset-switch"
import { fontClassName, presets } from "@/site/presets"
import { Providers } from "@/site/providers"
import { SiteNav } from "@/site/site-nav"
import { ThemeToggle } from "@/site/theme-toggle"
import "./globals.css"

const options = presets.map(({ id, label }) => ({ id, label }))

export const metadata: Metadata = {
  title: { default: "Fine", template: "%s · Fine" },
}

// Applies the stored theme class and preset before paint; without a theme, CSS follows the OS, and without a preset it is Ledger.
const themeScript = `try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.classList.add(t);var p=localStorage.getItem("preset");if(${JSON.stringify(options.slice(1).map(o => o.id))}.indexOf(p)>-1)document.documentElement.setAttribute("data-preset",p)}catch(e){}`

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={fontClassName} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh text-sm">
        <Providers>
          <div className="mx-auto grid max-w-[90rem] md:grid-cols-[15rem_minmax(0,1fr)]">
            <aside className="sticky top-0 hidden h-dvh flex-col gap-8 overflow-y-auto px-3 py-6 md:flex">
              <Link href="/" className="rounded-control px-3 font-display text-base font-strong tracking-tight">
                fine
              </Link>
              <SiteNav />
              <div className="mt-auto flex items-center gap-2 px-1">
                <PresetSwitch options={options} className="min-w-0 flex-1" />
                <ThemeToggle />
              </div>
            </aside>
            <header className="flex h-12 items-center justify-between gap-4 border-b-line border-border px-4 md:hidden">
              <Link href="/" className="rounded-control font-display text-base font-strong tracking-tight">
                fine
              </Link>
              <div className="flex items-center gap-2">
                <PresetSwitch options={options} className="w-32" />
                <ThemeToggle />
              </div>
            </header>
            <main id="main" className="min-w-0 px-4 py-8 md:px-10 md:py-9">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  )
}
