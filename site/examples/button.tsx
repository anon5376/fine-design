import { ArrowRight, Download } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Variants() {
  return (
    <>
      <Button>Save changes</Button>
      <Button variant="secondary">Cancel</Button>
      <Button variant="outline">Export</Button>
      <Button variant="ghost">Skip</Button>
      <Button variant="danger">Delete</Button>
    </>
  )
}

export function Sizes() {
  return (
    <>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </>
  )
}

export function WithIcon() {
  return (
    <>
      <Button variant="outline">
        <Download />
        Download
      </Button>
      <Button>
        Continue
        <ArrowRight />
      </Button>
    </>
  )
}

export function Loading() {
  return (
    <>
      <Button loading>Save changes</Button>
      <Button variant="outline" loading>
        Export
      </Button>
    </>
  )
}

export function Disabled() {
  return (
    <>
      <Button disabled>Save changes</Button>
      <Button variant="outline" disabled>
        Export
      </Button>
    </>
  )
}

export function AsLink() {
  return (
    <Button variant="outline" render={<a href="/tokens/" />}>
      Tokens
    </Button>
  )
}
