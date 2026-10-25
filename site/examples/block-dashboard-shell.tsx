"use client"

import { Calendar, Inbox, Users } from "lucide-react"
import { DashboardShell } from "@/components/blocks/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Text } from "@/components/ui/text"

export function NavigationAndContentSlot() {
  return (
    <DashboardShell
      brand="Fieldnotes"
      activeId="inbox"
      nav={[
        {
          label: "Workspace",
          items: [
            { id: "inbox", label: "Inbox", icon: Inbox, count: 4 },
            { id: "calendar", label: "Calendar", icon: Calendar },
            { id: "people", label: "People", icon: Users },
          ],
        },
      ]}
      breadcrumb={[{ label: "Acme Studio", href: "#inbox" }, { label: "Inbox" }]}
      account={{ name: "Jonas Weber", email: "jonas@acme.example" }}
      title="Inbox"
      actions={<Button variant="secondary">Mark all read</Button>}
    >
      <Card>
        <Text>Four unread notes.</Text>
      </Card>
    </DashboardShell>
  )
}
