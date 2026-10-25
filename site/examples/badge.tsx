import { Badge } from "@/components/ui/badge"

export function Variants() {
  return (
    <>
      <Badge>Draft</Badge>
      <Badge variant="outline">Archived</Badge>
      <Badge variant="success">Settled</Badge>
      <Badge variant="warning">Pending</Badge>
      <Badge variant="danger">Failed</Badge>
      <Badge variant="info">Scheduled</Badge>
    </>
  )
}

export function WithDot() {
  return (
    <Badge variant="success">
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      Live
    </Badge>
  )
}
