"use client"

import { useState } from "react"
import { Checklist, ChecklistItem } from "@/components/ui/checklist"

const setup = [
  { id: "email", label: "Verify your email", done: false },
  { id: "payment", label: "Add a payment method", done: false },
  { id: "team", label: "Invite your team", done: false },
  { id: "invoice", label: "Send your first invoice", done: true },
]

export function Setup() {
  const [tasks, setTasks] = useState(setup)
  return (
    <Checklist moveCompletedToEnd>
      {tasks.map(task => (
        <ChecklistItem key={task.id} checked={task.done} onCheckedChange={done => setTasks(t => t.map(x => (x.id === task.id ? { ...x, done } : x)))}>
          {task.label}
        </ChecklistItem>
      ))}
    </Checklist>
  )
}

const release = [
  { id: "changelog", label: "Write the changelog", done: true },
  { id: "tag", label: "Tag the release and publish the package to the registry", done: false },
  { id: "notes", label: "Post the release notes", done: false },
]

export function Release() {
  const [tasks, setTasks] = useState(release)
  return (
    <Checklist className="max-w-60">
      {tasks.map(task => (
        <ChecklistItem key={task.id} checked={task.done} onCheckedChange={done => setTasks(t => t.map(x => (x.id === task.id ? { ...x, done } : x)))}>
          {task.label}
        </ChecklistItem>
      ))}
    </Checklist>
  )
}
