"use client"

import { useState } from "react"
import { AutoHeight } from "@/components/ui/auto-height"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"

export function Steps() {
  const [step, setStep] = useState(0)
  const views = [
    <Field key="account">
      <FieldLabel>Work email</FieldLabel>
      <Input type="email" defaultValue="ada@northwind.example" />
    </Field>,
    <div key="plan" className="grid gap-3 text-sm">
      <p className="font-label">Growth</p>
      <p className="text-muted-foreground">Unlimited invoices, five team members, and a payout every weekday.</p>
      <p className="figures">$29 per month</p>
    </div>,
    <dl key="review" className="grid gap-2 text-sm">
      <div className="flex justify-between gap-4">
        <dt className="text-muted-foreground">Email</dt>
        <dd>ada@northwind.example</dd>
      </div>
      <div className="flex justify-between gap-4">
        <dt className="text-muted-foreground">Plan</dt>
        <dd>Growth</dd>
      </div>
      <div className="flex justify-between gap-4">
        <dt className="text-muted-foreground">Billed</dt>
        <dd className="figures">$29 per month</dd>
      </div>
      <div className="flex justify-between gap-4">
        <dt className="text-muted-foreground">Payout account</dt>
        <dd className="figures">Operating ·· 4821</dd>
      </div>
    </dl>,
  ]
  return (
    <div className="grid w-full max-w-sm gap-4">
      <AutoHeight transitionKey={step}>{views[step]}</AutoHeight>
      <div className="flex justify-between">
        <Button variant="outline" disabled={step === 0} onClick={() => setStep(s => s - 1)}>
          Back
        </Button>
        <Button disabled={step === views.length - 1} onClick={() => setStep(s => s + 1)}>
          Continue
        </Button>
      </div>
    </div>
  )
}

export function Expand() {
  const [billing, setBilling] = useState(false)
  return (
    <div className="grid w-full max-w-sm gap-4">
      <label className="flex items-center justify-between gap-4 text-sm font-label">
        Separate billing address
        <Switch checked={billing} onCheckedChange={setBilling} />
      </label>
      <AutoHeight>
        {billing && (
          <div className="grid gap-3">
            <Field>
              <FieldLabel>Street</FieldLabel>
              <Input autoComplete="off" defaultValue="18 Harbour Row" />
            </Field>
            <Field>
              <FieldLabel>City</FieldLabel>
              <Input autoComplete="off" defaultValue="Rotterdam" />
            </Field>
          </div>
        )}
      </AutoHeight>
    </div>
  )
}
