"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Step, Stepper } from "@/components/ui/stepper"

export function Checkout() {
  const [current, setCurrent] = useState(1)
  return (
    <div className="grid w-full max-w-xl gap-6">
      <Stepper current={current}>
        <Step title="Cart" />
        <Step title="Shipping" />
        <Step title="Payment" />
      </Stepper>
      <div className="flex justify-center gap-2">
        <Button variant="outline" disabled={current === 0} onClick={() => setCurrent(c => c - 1)}>
          Back
        </Button>
        <Button disabled={current === 3} onClick={() => setCurrent(c => c + 1)}>
          Continue
        </Button>
      </div>
    </div>
  )
}

export function Onboarding() {
  const [current, setCurrent] = useState(0)
  return (
    <div className="flex gap-10">
      <Stepper current={current} orientation="vertical">
        <Step title="Create account" />
        <Step title="Connect a bank" />
        <Step title="Invite your team" />
      </Stepper>
      <Button variant="outline" disabled={current === 3} onClick={() => setCurrent(c => c + 1)} className="self-start">
        Next step
      </Button>
    </div>
  )
}
