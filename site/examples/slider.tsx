import { Slider } from "@/components/ui/slider"

export function Single() {
  return <Slider aria-label="Slippage tolerance" defaultValue={40} className="max-w-xs" />
}

export function Range() {
  return <Slider aria-label="Price range" defaultValue={[20, 70]} className="max-w-xs" />
}

export function Disabled() {
  return <Slider aria-label="Volume" defaultValue={60} disabled className="max-w-xs" />
}
