import type { Metadata } from "next"
import { Showcase } from "@/site/showcase/showcase"

export const metadata: Metadata = { title: "Ledgerly", robots: { index: false, follow: false } }

// Unlisted: not in nav.ts. The app covers the viewport, so the docs chrome around it is taken out of the way.
const hideDocsChrome = `div.mx-auto.grid > :is(aside, header) { display: none }`

export default function ShowcasePage() {
  return (
    <>
      <style>{hideDocsChrome}</style>
      <Showcase />
    </>
  )
}
