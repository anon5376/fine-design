"use client"

import { useEffect, useState } from "react"
import { MotionConfig } from "motion/react"
import { FILM, FilmTimeProvider, useFilmTime } from "./clock"
import type { SceneDef } from "./scene"

/** A face the film needs before its first frame: the CSS variable next/font put on <html>, and every weight the scenes set in it. */
export type FilmFont = { variable: string; weights: readonly number[]; fallback?: string }

// Printable ASCII plus the dotless i the wordmark uses: the characters whose unicode-range subset must be loaded.
const TEXT = "ı" + Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i)).join("")

/** The family list next/font resolved for a variable, e.g. --font-geist-sans. */
const stackOf = ({ variable, fallback }: FilmFont) => getComputedStyle(document.documentElement).getPropertyValue(variable).trim() || fallback || "sans-serif"

/**
 * Resolves once every declared face is loaded at every declared weight, so no frame shows a fallback face. `status` is
 * "ok", or the faces document.fonts.check still reports as missing (the renderer refuses to start on those).
 */
function useFontsReady(fonts: readonly FilmFont[]) {
  const [state, setState] = useState({ ready: false, status: "loading" })
  const key = JSON.stringify(fonts)
  useEffect(() => {
    let live = true
    const faces = fonts.flatMap(font => font.weights.map(w => `${w} 100px ${stackOf(font)}`))
    Promise.all(faces.map(face => document.fonts.load(face, TEXT)))
      .then(() => document.fonts.ready)
      .then(() => {
        const missing = fonts.flatMap(font => font.weights.filter(w => !document.fonts.check(`${w} 100px ${stackOf(font)}`, TEXT)).map(w => `${font.variable}@${w}`))
        if (live) setState({ ready: true, status: missing.length ? `missing ${missing.join(" ")}` : "ok" })
      })
    return () => {
      live = false
    }
  }, [key]) // the value of `fonts`, so a new array with the same faces does not reload
  return state
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
 * A film: a fixed 1920x1080 stage with scenes mounted only inside their windows (the cut list). It plays in real
 * time for visitors (looping) and is driven frame by frame by scripts/render-film.mts, which waits for
 * [data-film-ready="true"] and reads [data-film-duration] and [data-film-fonts]. The stage is client-only: nothing
 * renders until mounted and the fonts are loaded.
 */
export function Stage({ scenes, duration, fonts }: { scenes: SceneDef[]; duration: number; fonts: readonly FilmFont[] }) {
  const time = useFilmTime(duration)
  const loaded = useFontsReady(fonts)
  const fit = useFit()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const ready = mounted && loaded.ready
  return (
    <MotionConfig reducedMotion="never">
      <div className="fixed inset-0 z-[9999] overflow-hidden" style={{ background: "var(--gray-950)" }}>
        <div
          data-film-ready={ready}
          data-film-time={time}
          data-film-duration={duration}
          data-film-fonts={loaded.status}
          className="absolute left-0 top-0 overflow-hidden"
          style={{ width: FILM.width, height: FILM.height, transform: `translate(${fit.x}px, ${fit.y}px) scale(${fit.scale})`, transformOrigin: "0 0", background: "var(--gray-950)" }}
        >
          {ready && (
            <FilmTimeProvider value={time}>
              {scenes.map(({ id, start, end, pre, post, Component }) =>
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
