"use client"

import type { SceneProps } from "@/site/film/scene"
import type { PresetId, Scheme } from "@/site/film03/presets"
import { LAB_CASES } from "./lab-cases"
import { MACROS } from "./macros"
import { Shot } from "./shot"

// The camera lab: a timeline for aiming and checking Shot, built only when NEXT_PUBLIC_FILM04_LAB=1 (timeline.ts), so the film's own build is untouched.
//   NEXT_PUBLIC_FILM04_LAB=1 film-shot.sh <outdir> 0.5,1.5,...    still i + 0.5 is case i of LAB_CASES (lab-cases.tsx; local time 0.5 within the case)
// With a query string it is one Shot of any macro, for a script or a browser (serve out/ after a lab build, open /film/v04/?t=0.5&lab=otp-input&...):
//   lab=<slug> preset=ledger scheme=light mt=<macro seconds> zoom=<1..40> fx,fy=<focus, component px> ax,ay=<frame px it lands on> debug=1 (anchors drawn)

export const LAB_DURATION = 40

const num = (v: string | null, d: number) => (v === null || v === "" || Number.isNaN(Number(v)) ? d : Number(v))

function QueryShot({ q }: { q: URLSearchParams }) {
  const def = MACROS.find(m => m.slug === q.get("lab"))!
  const { content } = def
  return (
    <Shot
      preset={(q.get("preset") as PresetId) ?? def.preset}
      scheme={(q.get("scheme") as Scheme) ?? def.scheme}
      t={num(q.get("mt"), 0)}
      content={content}
      debug={q.has("debug")}
      cam={{ zoom: num(q.get("zoom"), 1), focus: { x: num(q.get("fx"), 0), y: num(q.get("fy"), 0) }, at: { x: num(q.get("ax"), 100), y: num(q.get("ay"), 100) } }}
    />
  )
}

export function Lab({ t }: SceneProps) {
  const q = new URLSearchParams(location.search)
  if (q.has("lab")) return <QueryShot q={q} />
  const i = Math.min(LAB_CASES.length - 1, Math.max(0, Math.floor(t)))
  return <>{LAB_CASES[i](t - i)}</>
}
