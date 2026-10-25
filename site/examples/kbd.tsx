import { Kbd } from "@/components/ui/kbd"

export function Keys() {
  return (
    <>
      <Kbd>Esc</Kbd>
      <Kbd>Enter</Kbd>
      <Kbd>↑</Kbd>
      <Kbd>↓</Kbd>
    </>
  )
}

export function Chord() {
  return (
    <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
      <Kbd>⌘</Kbd>
      <Kbd>K</Kbd>
    </span>
  )
}
