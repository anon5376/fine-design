import type { Metadata } from "next"
import { hideChrome } from "@/site/film/hide-chrome"
import { Film04 } from "@/site/film04/film"
import { presetFontVariables, presetScopeCss } from "@/site/film03/preset-css"

export const metadata: Metadata = { title: "Film 0.4", robots: { index: false, follow: false } }

// Unlisted: not in nav.ts. The scope CSS gives every preset its complete tokens on a subtree (see site/film03/preset-css.ts).
export default function Film04Page() {
  return (
    <>
      <style>{hideChrome}</style>
      <style>{presetScopeCss()}</style>
      <Film04 fonts={presetFontVariables()} />
    </>
  )
}
