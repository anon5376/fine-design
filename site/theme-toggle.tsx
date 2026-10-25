"use client"

import { useEffect, useState } from "react"
import { Monitor, Moon, Sun } from "lucide-react"
import { IconButton } from "@/components/ui/icon-button"

type Theme = "system" | "light" | "dark"
const NEXT: Record<Theme, Theme> = { system: "light", light: "dark", dark: "system" }
const ICON = { system: Monitor, light: Sun, dark: Moon }

/**
 * Light/dark crossfades the whole page with a View Transition on the moderate tier (see
 * ::view-transition-*(root) in app/globals.css). Browsers without the API, and reduced motion, switch at once.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system")

  useEffect(() => {
    const stored = localStorage.getItem("theme")
    if (stored === "light" || stored === "dark") setTheme(stored)
  }, [])

  function cycle() {
    const next = NEXT[theme]
    const root = document.documentElement
    const apply = () => {
      root.classList.remove("light", "dark")
      if (next !== "system") root.classList.add(next)
    }
    if (next === "system") localStorage.removeItem("theme")
    else localStorage.setItem("theme", next)
    if (!document.startViewTransition || matchMedia("(prefers-reduced-motion: reduce)").matches) apply()
    else document.startViewTransition(apply)
    setTheme(next)
  }

  const Icon = ICON[theme]
  return (
    <IconButton label={`Theme: ${theme}`} onClick={cycle}>
      <Icon />
    </IconButton>
  )
}
