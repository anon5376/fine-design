import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"

const inbox = String.raw`
 .-----------------.
 |  _____________  |
 | |             | |
 | |   no mail   | |
 | |_____________| |
 |_________________|
`.slice(1)

const search = String.raw`
   .---.
  /     \
 |   ?   |
  \     /
   '---'\
         \\
`.slice(1)

export function WithAction() {
  return (
    <EmptyState
      className="w-full max-w-md"
      art={inbox}
      title="No invoices yet."
      action={
        <Button size="sm">
          <Plus />
          New invoice
        </Button>
      }
    />
  )
}

export function NoResults() {
  return <EmptyState className="w-full max-w-md" art={search} title="No transfers match these filters." />
}
