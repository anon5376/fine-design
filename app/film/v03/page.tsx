import type { Metadata } from "next"
import { hideChrome } from "@/site/film/hide-chrome"
import { Film03 } from "@/site/film03/film"
import { presetFontVariables, presetScopeCss } from "@/site/film03/preset-css"

export const metadata: Metadata = { title: "Film 0.3", robots: { index: false, follow: false } }

// Unlisted: not in nav.ts. The scope CSS gives every preset its complete tokens on a subtree (see preset-css.ts).
export default function Film03Page() {
  return (
    <>
      <style>{hideChrome}</style>
      <style>{presetScopeCss()}</style>
      <Film03 fonts={presetFontVariables()} />
    </>
  )
}
