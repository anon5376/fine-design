import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// Teaches tailwind-merge Fine's preset utilities (scripts/presets, styles/fine.css), so `className="h-12"` or
// `border-0` still replaces `h-control-md` or `border-line` instead of sitting beside it.
const sizes = ["sm", "md", "lg"]
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      spacing: [...sizes.map(s => `control-${s}`), ...["control", "field", "container"].flatMap(g => sizes.map(s => `pad-${g}-${s}`))],
      "font-weight": ["label", "title", "strong"],
      font: ["display"],
      radius: ["control", "container", "small", "pill"],
      shadow: ["raised", "control", "overlay"],
    },
    classGroups: {
      "border-w": [{ border: ["line"] }],
      "border-w-t": [{ "border-t": ["line"] }],
      "border-w-r": [{ "border-r": ["line"] }],
      "border-w-b": [{ "border-b": ["line"] }],
      "border-w-l": [{ "border-l": ["line"] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
