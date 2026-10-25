import { Heading } from "@/components/ui/heading"

export function Levels() {
  return (
    <div className="grid gap-3">
      <Heading level={1}>Treasury</Heading>
      <Heading level={2}>Recent transfers</Heading>
      <Heading level={3}>Pending approval</Heading>
    </div>
  )
}

export function Sizes() {
  return (
    <div className="grid gap-3">
      <Heading size="display">Ship faster</Heading>
      <Heading size="xl">Ship faster</Heading>
      <Heading size="lg">Ship faster</Heading>
      <Heading size="md">Ship faster</Heading>
      <Heading size="sm">Ship faster</Heading>
    </div>
  )
}
