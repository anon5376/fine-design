import type { Metadata } from "next"
import { Film } from "@/site/film/first-film"
import { hideChrome } from "@/site/film/hide-chrome"

export const metadata: Metadata = { title: "Film", robots: { index: false, follow: false } }

// Unlisted: not in nav.ts.
export default function FilmPage() {
  return (
    <>
      <style>{hideChrome}</style>
      <Film />
    </>
  )
}
