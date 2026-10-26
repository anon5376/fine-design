"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { OtpInput } from "@/components/ui/otp-input"
import { toast } from "@/components/ui/toast"

export function Verify() {
  const [status, setStatus] = useState<"idle" | "invalid" | "success">("idle")
  return (
    <Field className="w-full max-w-xs" invalid={status === "invalid"}>
      <FieldLabel>Verification code</FieldLabel>
      <OtpInput
        invalid={status === "invalid"}
        state={status === "success" ? "success" : "idle"}
        onValueChange={() => setStatus("idle")}
        // Stand-in for the server check.
        onComplete={code => setStatus(code === "123456" ? "success" : "invalid")}
      />
      <FieldDescription>Six digits. In this demo, 123456 is correct.</FieldDescription>
      {status === "invalid" && <FieldError match>That code is not right. Check it and try again.</FieldError>}
    </Field>
  )
}

export function Pin() {
  const [pin, setPin] = useState("")
  return (
    <Field className="w-full max-w-xs">
      <FieldLabel>PIN</FieldLabel>
      <OtpInput length={4} value={pin} onValueChange={setPin} onComplete={() => toast.add({ title: "PIN saved", type: "success" })} />
      <Button variant="ghost" size="sm" className="justify-self-start" disabled={!pin} onClick={() => setPin("")}>
        Clear
      </Button>
    </Field>
  )
}
