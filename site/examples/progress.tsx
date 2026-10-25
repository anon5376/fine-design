"use client"

import { useEffect, useState } from "react"
import { Progress } from "@/components/ui/progress"

export function Default() {
  return <Progress label="Storage" value={62} className="max-w-sm" />
}

export function Accent() {
  return <Progress label="Raised" value={84} variant="accent" className="max-w-sm" />
}

export function Indeterminate() {
  return <Progress label="Syncing ledger" value={null} className="max-w-sm" />
}

export function Live() {
  const [value, setValue] = useState(10)
  useEffect(() => {
    const id = setInterval(() => setValue(v => (v >= 100 ? 10 : v + 15)), 1200)
    return () => clearInterval(id)
  }, [])
  return <Progress label="Uploading statements" value={Math.min(value, 100)} className="max-w-sm" />
}
