import { Bold, Italic, Link, Underline } from "lucide-react"
import { IconButton } from "@/components/ui/icon-button"
import { Tooltip, TooltipProvider } from "@/components/ui/tooltip"

export function Toolbar() {
  return (
    <TooltipProvider>
      <div role="toolbar" aria-label="Formatting" className="flex gap-1">
        <Tooltip content="Bold">
          <IconButton label="Bold">
            <Bold />
          </IconButton>
        </Tooltip>
        <Tooltip content="Italic">
          <IconButton label="Italic">
            <Italic />
          </IconButton>
        </Tooltip>
        <Tooltip content="Underline">
          <IconButton label="Underline">
            <Underline />
          </IconButton>
        </Tooltip>
        <Tooltip content="Add link">
          <IconButton label="Add link">
            <Link />
          </IconButton>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}

export function Sides() {
  return (
    <>
      {(["top", "right", "bottom", "left"] as const).map(side => (
        <Tooltip key={side} content={side} side={side}>
          <IconButton label={`Tooltip on ${side}`} variant="outline">
            <Link />
          </IconButton>
        </Tooltip>
      ))}
    </>
  )
}
