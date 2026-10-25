import { Trash2 } from "lucide-react"
import { VisuallyHidden } from "@/components/ui/visually-hidden"

export function Default() {
  return (
    <button type="button" className="inline-flex size-9 items-center justify-center rounded-control hover:bg-hover">
      <Trash2 className="size-4" strokeWidth={1.5} aria-hidden />
      <VisuallyHidden>Delete invoice 2041</VisuallyHidden>
    </button>
  )
}
