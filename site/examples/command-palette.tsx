"use client"

import { useEffect, useState } from "react"
import { ArrowLeftRight, FileText, Moon, Plus, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CommandPalette, type CommandGroup } from "@/components/ui/command-palette"
import { Kbd } from "@/components/ui/kbd"
import { toast } from "@/components/ui/toast"

const groups: CommandGroup[] = [
  {
    label: "Create",
    items: [
      { id: "invoice", label: "New invoice", icon: Plus, shortcut: ["⌘", "N"], onSelect: () => toast.add({ title: "New invoice" }) },
      { id: "transfer", label: "New transfer", icon: ArrowLeftRight, onSelect: () => toast.add({ title: "New transfer" }) },
    ],
  },
  {
    label: "Go to",
    items: [
      { id: "statements", label: "Statements", icon: FileText, onSelect: () => toast.add({ title: "Statements" }) },
      { id: "settings", label: "Settings", icon: Settings, shortcut: ["⌘", ","], onSelect: () => toast.add({ title: "Settings" }) },
      { id: "theme", label: "Toggle theme", icon: Moon, onSelect: () => toast.add({ title: "Toggle theme" }) },
    ],
  },
]

export function Default() {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(o => !o)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Commands
        <span className="flex gap-0.5">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </span>
      </Button>
      <CommandPalette open={open} onOpenChange={setOpen} groups={groups} />
    </>
  )
}
