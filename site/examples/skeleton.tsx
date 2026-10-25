import { Skeleton } from "@/components/ui/skeleton"

export function Row() {
  return (
    <div aria-busy="true" className="flex w-full max-w-sm items-center gap-3">
      <Skeleton className="size-8 rounded-full" />
      <div className="grid flex-1 gap-2">
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  )
}

export function Card() {
  return (
    <div aria-busy="true" className="grid w-full max-w-sm gap-3 rounded-container border border-border p-5">
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-3 w-full" />
    </div>
  )
}
