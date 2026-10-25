import type { Metadata } from "next"
import type { ReactNode } from "react"
import Link from "next/link"
import { Geist, Geist_Mono } from "next/font/google"
import { Providers } from "@/site/providers"
import { SiteNav } from "@/site/site-nav"
import { ThemeToggle } from "@/site/theme-toggle"
import "./globals.css"

const sans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" })
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" })

export const metadata: Metadata = {
  title: { default: "Fine", template: "%s · Fine" },
}

// Applies the stored theme class before paint; without one, CSS follows the OS.
const themeScript = `try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.classList.add(t)}catch(e){}`

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh text-sm">
        <Providers>
          <div className="mx-auto grid max-w-[90rem] md:grid-cols-[15rem_minmax(0,1fr)]">
            <aside className="sticky top-0 hidden h-dvh flex-col gap-8 overflow-y-auto px-3 py-6 md:flex">
              <Link href="/" className="rounded-control px-3 text-base font-semibold tracking-tight">
                fine
              </Link>
              <SiteNav />
              <div className="mt-auto px-1">
                <ThemeToggle />
              </div>
            </aside>
            <header className="flex h-12 items-center justify-between gap-4 border-b border-border px-4 md:hidden">
              <Link href="/" className="rounded-control text-base font-semibold tracking-tight">
                fine
              </Link>
              <ThemeToggle />
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
