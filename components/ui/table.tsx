import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"

/** Scrolls sideways on narrow screens. Give it an aria-label when nothing on the page names it. */
function Table({ className, ...props }: ComponentProps<"table">) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn("w-full border-collapse text-sm", className)} {...props} />
    </div>
  )
}

function TableHeader({ className, ...props }: ComponentProps<"thead">) {
  return <thead className={cn("border-b-line border-border", className)} {...props} />
}

function TableBody({ className, ...props }: ComponentProps<"tbody">) {
  return <tbody className={cn("[&>tr:not(:last-child)]:border-b-line [&>tr]:border-border", className)} {...props} />
}

function TableRow({ className, ...props }: ComponentProps<"tr">) {
  return <tr className={cn("aria-selected:bg-active", className)} {...props} />
}

type CellAlign = { /** Right-aligned tabular figures for amounts, counts and IDs. */ numeric?: boolean }

function TableHead({ className, numeric, ...props }: ComponentProps<"th"> & CellAlign) {
  return (
    <th
      scope="col"
      className={cn("h-control-md whitespace-nowrap px-3 text-left text-xs font-label text-muted-foreground first:pl-0 last:pr-0", numeric && "text-right", className)}
      {...props}
    />
  )
}

function TableCell({ className, numeric, ...props }: ComponentProps<"td"> & CellAlign) {
  return <td className={cn("h-11 px-3 align-middle first:pl-0 last:pr-0", numeric && "figures text-right", className)} {...props} />
}

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell }
