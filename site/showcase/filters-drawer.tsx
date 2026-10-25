"use client"

import { Button } from "@/components/ui/button"
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Tag, TagList } from "@/components/ui/tag"
import { amountMax, money, type Status } from "@/site/showcase/data"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  statuses: Status[]
  onStatusesChange: (statuses: Status[]) => void
  range: number[]
  onRangeChange: (range: number[]) => void
  onReset: () => void
}

export function FiltersDrawer({ open, onOpenChange, statuses, onStatusesChange, range, onRangeChange, onReset }: Props) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerTitle>Filters</DrawerTitle>
        <div className="grid gap-2">
          <Label id="filter-status">Status</Label>
          <TagList aria-labelledby="filter-status" role="group" className="min-h-6">
            {statuses.map(status => (
              <Tag key={status} onRemove={() => onStatusesChange(statuses.filter(s => s !== status))}>
                {status}
              </Tag>
            ))}
          </TagList>
        </div>
        <div className="grid gap-3">
          <div className="flex items-baseline justify-between gap-4">
            <Label id="filter-amount">Amount</Label>
            <span className="figures text-sm">
              {money(range[0])} to {money(range[1])}
            </span>
          </div>
          <Slider aria-labelledby="filter-amount" min={0} max={amountMax} step={500} value={range} onValueChange={v => onRangeChange(v as number[])} />
        </div>
        <Button variant="outline" onClick={onReset} className="justify-self-start">
          Reset
        </Button>
      </DrawerContent>
    </Drawer>
  )
}
