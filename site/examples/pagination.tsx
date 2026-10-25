"use client"

import { useState } from "react"
import { Pagination } from "@/components/ui/pagination"

export function SmallCount() {
  return <Pagination pageCount={5} defaultPage={2} />
}

export function LargeCount() {
  return <Pagination pageCount={48} defaultPage={24} />
}

export function FirstPage() {
  return <Pagination pageCount={48} defaultPage={1} />
}

export function LastPage() {
  return <Pagination pageCount={48} defaultPage={48} />
}

export function Sizes() {
  return (
    <div className="grid justify-items-center gap-4">
      <Pagination size="sm" pageCount={12} defaultPage={6} />
      <Pagination size="md" pageCount={12} defaultPage={6} />
      <Pagination size="lg" pageCount={12} defaultPage={6} />
    </div>
  )
}

export function Controlled() {
  const [page, setPage] = useState(7)
  return (
    <div className="grid justify-items-center gap-3">
      <Pagination pageCount={24} page={page} onPageChange={setPage} />
      <p className="figures text-sm text-muted-foreground">
        Transfers {(page - 1) * 10 + 1} to {page * 10} of 240
      </p>
    </div>
  )
}

export function AsLinks() {
  return <Pagination pageCount={9} defaultPage={3} renderPage={page => <a href={`#page-${page}`} />} />
}
