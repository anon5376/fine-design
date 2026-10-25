"use client"

import { useSyncExternalStore } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"

type Option = { id: string; label: string }

// The attribute on <html> is the state (the inline script in app/layout.tsx sets it before paint), so both switches,
// sidebar and mobile header, read it and stay in step. No attribute means the first option, Ledger.
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-preset"] })
  return () => observer.disconnect()
}

/** Chooses the docs' preset: data-preset on <html>, remembered in localStorage "preset". Instant, no transition. */
export function PresetSwitch({ options, className }: { options: Option[]; className?: string }) {
  const fallback = options[0].id
  const value = useSyncExternalStore(
    subscribe,
    () => {
      const set = document.documentElement.getAttribute("data-preset")
      return options.some(o => o.id === set) ? set! : fallback
    },
    () => fallback,
  )

  function choose(next: string | null) {
    if (!next) return
    const root = document.documentElement
    try {
      if (next === fallback) localStorage.removeItem("preset")
      else localStorage.setItem("preset", next)
    } catch {}
    if (next === fallback) root.removeAttribute("data-preset")
    else root.setAttribute("data-preset", next)
  }

  return (
    <Select items={options.map(o => ({ value: o.id, label: o.label }))} value={value} onValueChange={choose}>
      <SelectTrigger aria-label="Preset" className={className} />
      <SelectContent>
        {options.map(o => (
          <SelectItem key={o.id} value={o.id}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
