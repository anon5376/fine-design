import { Pencil, Settings, Trash2 } from "lucide-react"
import { IconButton } from "@/components/ui/icon-button"

export function Variants() {
  return (
    <>
      <IconButton label="Settings">
        <Settings />
      </IconButton>
      <IconButton label="Edit" variant="outline">
        <Pencil />
      </IconButton>
      <IconButton label="Edit" variant="secondary">
        <Pencil />
      </IconButton>
      <IconButton label="Delete" variant="danger">
        <Trash2 />
      </IconButton>
    </>
  )
}

export function Sizes() {
  return (
    <>
      <IconButton label="Settings" size="sm" variant="outline">
        <Settings />
      </IconButton>
      <IconButton label="Settings" size="md" variant="outline">
        <Settings />
      </IconButton>
      <IconButton label="Settings" size="lg" variant="outline">
        <Settings />
      </IconButton>
    </>
  )
}
