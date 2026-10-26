"use client"

import { useEffect, useState } from "react"
import { Avatar } from "@/components/ui/avatar"
import { ease, lerp, progress } from "@/site/film/clock"
import { FACES, facesDecoded } from "./avatar-images"
import { MacroFrame, CenterBox } from "./frame"

// s3 macro 4, 12.5-14.0, Poster dark: five Avatars show their initials; the images arrive one by one, 0.15s apart, each fading in
// over the initials on the fast tier (opacity, ease-enter; 80ms, slowed 2x to read). The Avatar is the real one in its fallback state;
// the image layer is clock-driven, because Base UI flips to the image when the browser's load finishes, not when the film says so.
const FIRST = 0.34
const STEP = 0.15
const FADE = 0.16
const K = 9.6

export function AvatarMacro({ t }: { t: number }) {
  const [decoded, setDecoded] = useState(false)
  useEffect(() => {
    facesDecoded.then(() => setDecoded(true))
  }, [])
  const p = progress(t, 0, 1.5)
  const cam = { s: lerp(0.95, 1.04, ease.out(p)), ry: lerp(-4, 4, ease.out(p)), rx: lerp(2, -1.5, ease.out(p)), y: 0, p: 2400 }
  return (
    <MacroFrame preset="poster" scheme="dark" t={t} cam={cam} caption="Avatar">
      <CenterBox w={172} h={40} zoom={K}>
        <div className="flex">
          {FACES.map((f, i) => (
            <div key={f.initials} className="relative size-10 shrink-0 overflow-hidden rounded-full" style={{ marginLeft: i ? -7 : 0, boxShadow: "0 0 0 2px var(--background)" }}>
              <Avatar size="lg" alt={f.name} fallback={f.initials} />
              <img
                src={f.src}
                alt=""
                decoding="sync"
                className="absolute inset-0 size-full rounded-full object-cover"
                style={{ opacity: decoded ? ease.enter(progress(t, FIRST + i * STEP, FADE)) : 0 }}
              />
            </div>
          ))}
        </div>
      </CenterBox>
    </MacroFrame>
  )
}
