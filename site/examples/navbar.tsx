"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Navbar, NavbarBrand, NavbarLink } from "@/components/ui/navbar"

const links = [
  { id: "overview", label: "Overview" },
  { id: "transfers", label: "Transfers" },
  { id: "invoices", label: "Invoices" },
  { id: "wallets", label: "Wallets" },
]

export function Default() {
  const [current, setCurrent] = useState("transfers")
  return (
    <div className="w-full overflow-hidden rounded-container border-line">
      <Navbar
        brand={<NavbarBrand render={<a href="#home" />}>Ledgerly</NavbarBrand>}
        action={<Button size="sm">New transfer</Button>}
      >
        {links.map(link => (
          <NavbarLink key={link.id} render={<a href={`#${link.id}`} onClick={() => setCurrent(link.id)} />} active={current === link.id}>
            {link.label}
          </NavbarLink>
        ))}
      </Navbar>
    </div>
  )
}
