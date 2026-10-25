import type { Metadata } from "next"
import { Film } from "@/site/film/Stage"

export const metadata: Metadata = { title: "Film", robots: { index: false, follow: false } }

// Unlisted: not in nav.ts. The stage covers the viewport; the docs chrome (and the Next dev badge) are taken out of the way.
const hideChrome = `div.mx-auto.grid > :is(aside, header) { display: none } html, body { overflow: hidden; background: var(--gray-950) } nextjs-portal { display: none }`

export default function FilmPage() {
  return (
    <>
      <style>{hideChrome}</style>
      <Film />
    </>
  )
}
