"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { NotificationBell } from "@/components/ui/notification-bell"

export function Inbox() {
  const [count, setCount] = useState(3)
  return (
    <>
      <NotificationBell count={count} variant="outline" />
      <Button variant="outline" onClick={() => setCount(c => c + 1)}>
        New message
      </Button>
      <Button variant="outline" onClick={() => setCount(c => Math.max(0, c - 1))}>
        Read one
      </Button>
      <Button variant="outline" onClick={() => setCount(0)}>
        Mark all read
      </Button>
    </>
  )
}

export function Busy() {
  return <NotificationBell count={128} />
}
