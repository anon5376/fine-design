"use client"

import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { usePreset } from "@/site/use-preset"

type Option = { id: string; label: string }

/** Chooses the docs' preset: data-preset on <html>, remembered in localStorage "preset". Instant, no transition. */
export function PresetSwitch({ options, className }: { options: Option[]; className?: string }) {
  const fallback = options[0].id
  const value = usePreset(options.map(o => o.id))

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
