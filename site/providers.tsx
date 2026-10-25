"use client"

import { useEffect, type ReactNode } from "react"
import { MotionConfig } from "motion/react"
import { Toaster } from "@/components/ui/toast"

/** reducedMotion="user": with the OS setting on, Motion drops transforms and keeps opacity/color fades. */
export function Providers({ children }: { children: ReactNode }) {
  // Lets the Playwright specs wait for hydration instead of guessing.
  useEffect(() => document.documentElement.setAttribute("data-hydrated", ""), [])
  return (
    <MotionConfig reducedMotion="user">
      {children}
      <Toaster />
    </MotionConfig>
  )
}
