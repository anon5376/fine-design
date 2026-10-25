"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function Confirm() {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="danger" />}>Delete invoice</DialogTrigger>
      <DialogContent>
        <DialogTitle>Delete invoice 2041?</DialogTitle>
        <DialogDescription>This removes it for everyone on the team.</DialogDescription>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <DialogClose render={<Button variant="danger" />}>Delete</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function Form() {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>Rename wallet</DialogTrigger>
      <DialogContent>
        <DialogTitle>Rename wallet</DialogTitle>
        <Field>
          <FieldLabel>Name</FieldLabel>
          <Input defaultValue="Operating" />
        </Field>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <DialogClose render={<Button />}>Save</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
