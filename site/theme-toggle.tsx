"use client"

import { useEffect, useState } from "react"
import { Monitor, Moon, Sun } from "lucide-react"
import { IconButton } from "@/components/ui/icon-button"

type Theme = "system" | "light" | "dark"
const NEXT: Record<Theme, Theme> = { system: "light", light: "dark", dark: "system" }
const ICON = { system: Monitor, light: Sun, dark: Moon }

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system")

  useEffect(() => {
    const stored = localStorage.getItem("theme")
    if (stored === "light" || stored === "dark") setTheme(stored)
  }, [])

  function cycle() {
    const next = NEXT[theme]
    const root = document.documentElement
    root.classList.remove("light", "dark")
    if (next === "system") localStorage.removeItem("theme")
    else {
      root.classList.add(next)
      localStorage.setItem("theme", next)
    }
    setTheme(next)
  }

  const Icon = ICON[theme]
  return (
    <IconButton label={`Theme: ${theme}`} onClick={cycle}>
      <Icon />
    </IconButton>
  )
}
