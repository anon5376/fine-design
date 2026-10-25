"use client"

import { Button } from "@/components/ui/button"
import { Drawer, DrawerClose, DrawerContent, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"

export function Right() {
  return (
    <Drawer>
      <DrawerTrigger render={<Button variant="outline" />}>Filters</DrawerTrigger>
      <DrawerContent>
        <DrawerTitle>Filters</DrawerTitle>
        <Field>
          <FieldLabel>Minimum amount</FieldLabel>
          <Input inputMode="decimal" defaultValue="1,000" />
        </Field>
        <label className="flex items-center justify-between gap-4 text-sm">
          Outgoing only
          <Switch defaultChecked />
        </label>
        <DrawerClose render={<Button className="mt-2" />}>Apply</DrawerClose>
      </DrawerContent>
    </Drawer>
  )
}

export function Bottom() {
  return (
    <Drawer side="bottom">
      <DrawerTrigger render={<Button variant="outline" />}>Share</DrawerTrigger>
      <DrawerContent>
        <DrawerTitle>Share report</DrawerTitle>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary">Copy link</Button>
          <Button variant="secondary">Email</Button>
          <Button variant="secondary">Download CSV</Button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
