import { Avatar } from "@/components/ui/avatar"

export function Sizes() {
  return (
    <>
      <Avatar size="sm" src="/avatars/ada.svg" alt="Ada Lovelace" fallback="AL" />
      <Avatar size="md" src="/avatars/ada.svg" alt="Ada Lovelace" fallback="AL" />
      <Avatar size="lg" src="/avatars/ada.svg" alt="Ada Lovelace" fallback="AL" />
    </>
  )
}

export function Fallback() {
  return (
    <>
      <Avatar alt="Grace Hopper" fallback="GH" />
      <Avatar src="/avatars/missing.svg" alt="Alan Turing" fallback="AT" />
    </>
  )
}

export function Stacked() {
  return (
    <div className="flex -space-x-2">
      <Avatar src="/avatars/ada.svg" alt="Ada Lovelace" fallback="AL" className="ring-2 ring-surface" />
      <Avatar src="/avatars/lin.svg" alt="Lin Wei" fallback="LW" className="ring-2 ring-surface" />
      <Avatar alt="Grace Hopper" fallback="GH" className="ring-2 ring-surface" />
    </div>
  )
}
