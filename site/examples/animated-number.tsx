"use client"

import { useState } from "react"
import { AnimatedNumber } from "@/components/ui/animated-number"
import { Button } from "@/components/ui/button"

export function Counter() {
  const [value, setValue] = useState(1280)
  return (
    <>
      <AnimatedNumber value={value} className="text-3xl font-title" />
      <Button variant="outline" onClick={() => setValue(v => v - 125)}>
        Subtract 125
      </Button>
      <Button variant="outline" onClick={() => setValue(v => v + 125)}>
        Add 125
      </Button>
    </>
  )
}

export function Currency() {
  const [balance, setBalance] = useState(248630.42)
  return (
    <>
      <AnimatedNumber value={balance} format={{ style: "currency", currency: "USD" }} className="text-3xl font-title" />
      <Button variant="outline" onClick={() => setBalance(v => v - 12480)}>
        Send $12,480.00
      </Button>
      <Button variant="outline" onClick={() => setBalance(v => v + 1250.4)}>
        Receive $1,250.40
      </Button>
    </>
  )
}
