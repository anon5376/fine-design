import { useSyncExternalStore } from "react"

// The attribute on <html> is the state (the inline script in app/layout.tsx sets it before paint), so every reader
// stays in step. No attribute means the first id, Ledger.
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-preset"] })
  return () => observer.disconnect()
}

/** The docs' selected preset: data-preset on <html> when it names one of `ids`, else the first. */
export function usePreset(ids: string[]) {
  return useSyncExternalStore(
    subscribe,
    () => {
      const set = document.documentElement.getAttribute("data-preset")
      return set && ids.includes(set) ? set : ids[0]
    },
    () => ids[0],
  )
}
