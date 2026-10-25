"use client"

import { useEffect, useState } from "react"
import { MotionConfig } from "motion/react"
import { FILM, FilmTimeProvider, useFilmTime } from "./clock"
import { fontStack } from "./wordmark"
import { SCENES } from "./timeline"

/** Resolves once Geist (every weight the film uses) and Geist Mono are loaded, so no frame shows a fallback face. */
function useFontsReady() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let live = true
    const sans = fontStack("sans")
    const mono = fontStack("mono")
    const text = "fineı 0123456789$,.:/-_@%+ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
    Promise.all([
      ...[400, 500, 600, 700].map(w => document.fonts.load(`${w} 100px ${sans}`, text)),
      ...[400, 500, 600].map(w => document.fonts.load(`${w} 100px ${mono}`, text)),
    ])
      .then(() => document.fonts.ready)
      .then(() => live && setReady(true))
    return () => {
      live = false
    }
  }, [])
  return ready
}

/** Fit 1920x1080 inside the window, letterboxed. At exactly 1920x1080 (the renderer) the scale is 1. */
function useFit() {
  const [fit, setFit] = useState({ scale: 1, x: 0, y: 0 })
  useEffect(() => {
    const update = () => {
      const scale = Math.min(innerWidth / FILM.width, innerHeight / FILM.height)
      setFit({ scale, x: (innerWidth - FILM.width * scale) / 2, y: (innerHeight - FILM.height * scale) / 2 })
    }
    update()
    addEventListener("resize", update)
    return () => removeEventListener("resize", update)
  }, [])
  return fit
}

/**
 * The film: a fixed 1920x1080 stage with scenes mounted only inside their windows (timeline.ts). It plays in real
 * time for visitors (looping) and is driven frame by frame by scripts/render-film.mts, which waits for
 * [data-film-ready="true"]. The stage is client-only: nothing renders until mounted and the fonts are loaded.
 */
export function Film() {
  const time = useFilmTime()
  const fontsReady = useFontsReady()
  const fit = useFit()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const ready = mounted && fontsReady
  return (
    <MotionConfig reducedMotion="never">
      <div className="fixed inset-0 z-[9999] overflow-hidden" style={{ background: "var(--gray-950)" }}>
        <div
          data-film-ready={ready}
          data-film-time={time}
          className="absolute left-0 top-0 overflow-hidden"
          style={{ width: FILM.width, height: FILM.height, transform: `translate(${fit.x}px, ${fit.y}px) scale(${fit.scale})`, transformOrigin: "0 0", background: "var(--gray-950)" }}
        >
          {ready && (
            <FilmTimeProvider value={time}>
              {SCENES.map(({ id, start, end, pre, post, Component }) =>
                time >= start - pre && time < end + post ? (
                  <div key={id} data-scene={id} className="absolute inset-0">
                    <Component t={Math.round((time - start) * 1e6) / 1e6} duration={end - start} />
                  </div>
                ) : null,
              )}
            </FilmTimeProvider>
          )}
        </div>
      </div>
    </MotionConfig>
  )
}
