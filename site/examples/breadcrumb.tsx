"use client"

import type { ComponentProps } from "react"
import { Breadcrumb, BreadcrumbEllipsis, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"

export function Default() {
  return (
    <Breadcrumb>
      <BreadcrumbItem>
        <BreadcrumbLink href="#">Billing</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbLink href="#">Invoices</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbPage className="figures">INV-2041</BreadcrumbPage>
      </BreadcrumbItem>
    </Breadcrumb>
  )
}

export function Collapsed() {
  return (
    <Breadcrumb>
      <BreadcrumbItem>
        <BreadcrumbLink href="#">Home</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbEllipsis>
          <DropdownMenuItem render={<a href="#" />}>Treasury</DropdownMenuItem>
          <DropdownMenuItem render={<a href="#" />}>Wallets</DropdownMenuItem>
          <DropdownMenuItem render={<a href="#" />}>Operating account</DropdownMenuItem>
        </BreadcrumbEllipsis>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbLink href="#">Transfers</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbPage className="figures">tx_8f21</BreadcrumbPage>
      </BreadcrumbItem>
    </Breadcrumb>
  )
}

// Stand-in for a router's link component (Next.js Link, React Router Link).
function AppLink(props: ComponentProps<"a">) {
  return <a {...props} />
}

export function AsLinks() {
  return (
    <Breadcrumb>
      <BreadcrumbItem>
        <BreadcrumbLink render={<AppLink href="#" />}>Wallets</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbLink render={<AppLink href="#" />}>Settlement</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbPage>Payout schedule</BreadcrumbPage>
      </BreadcrumbItem>
    </Breadcrumb>
  )
}
