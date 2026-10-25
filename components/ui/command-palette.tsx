"use client"

import type { LucideIcon } from "lucide-react"
import { Autocomplete } from "@base-ui/react/autocomplete"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { Search } from "lucide-react"
import { backdropClass, dialogMotion } from "@/components/ui/dialog"
import { Kbd } from "@/components/ui/kbd"
import { popupItem } from "@/lib/popup"
import { cn } from "@/lib/utils"

type Command = {
  id: string
  label: string
  icon?: LucideIcon
  /** Keys shown at the end of the row, e.g. ["⌘", "N"]. Display only; bind them yourself. */
  shortcut?: string[]
  onSelect: () => void
}
type CommandGroup = { label: string; items: Command[] }

type CommandPaletteProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  groups: CommandGroup[]
}

/**
 * Searchable command list in a dialog. Focus stays in the input (aria-activedescendant); the
 * first match is always highlighted, so Enter runs it. Motion: Fluid dialog on the slow tier (dialogMotion), reduced motion keeps the fade.
 */
function CommandPalette({ open, onOpenChange, groups }: CommandPaletteProps) {
  const run = (command: Command) => {
    onOpenChange(false)
    command.onSelect()
  }
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className={backdropClass} />
        <DialogPrimitive.Viewport className="fixed inset-0 z-(--z-overlay) flex justify-center px-4 pt-[12dvh]">
          <DialogPrimitive.Popup
            aria-label="Command palette"
            className={cn(
              "flex h-fit max-h-[min(28rem,76dvh)] w-full max-w-xl flex-col overflow-hidden rounded-container border-line border-border bg-surface text-sm text-foreground shadow-overlay outline-none",
              dialogMotion,
            )}
          >
            <Autocomplete.Root inline open items={groups} itemToStringValue={(c: Command) => c.label} autoHighlight="always">
              <div className="flex items-center gap-2 border-b-line border-border px-3">
                <Search aria-hidden className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
                <Autocomplete.Input aria-label="Search commands" placeholder="Search" className="h-11 w-full bg-transparent outline-none placeholder:text-muted-foreground" />
              </div>
              <Autocomplete.Empty className="px-3 py-6 text-center text-muted-foreground empty:hidden">No commands match.</Autocomplete.Empty>
              <Autocomplete.List className="overflow-y-auto p-1 empty:hidden">
                {(group: CommandGroup) => (
                  <Autocomplete.Group key={group.label} items={group.items} className="pb-1">
                    <Autocomplete.GroupLabel className="px-2 pt-2 pb-1 text-xs font-label text-muted-foreground">{group.label}</Autocomplete.GroupLabel>
                    <Autocomplete.Collection>
                      {(command: Command) => (
                        <Autocomplete.Item
                          key={command.id}
                          value={command}
                          onClick={() => run(command)}
                          className={cn(popupItem, "cursor-pointer data-highlighted:bg-hover")}
                        >
                          {command.icon && <command.icon aria-hidden className="text-muted-foreground" strokeWidth={1.5} />}
                          <span className="truncate">{command.label}</span>
                          {command.shortcut && (
                            <span className="ml-auto flex gap-1">
                              {command.shortcut.map(k => (
                                <Kbd key={k}>{k}</Kbd>
                              ))}
                            </span>
                          )}
                        </Autocomplete.Item>
                      )}
                    </Autocomplete.Collection>
                  </Autocomplete.Group>
                )}
              </Autocomplete.List>
            </Autocomplete.Root>
          </DialogPrimitive.Popup>
        </DialogPrimitive.Viewport>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

export { CommandPalette }
export type { Command, CommandGroup, CommandPaletteProps }
