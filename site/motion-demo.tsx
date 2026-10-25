"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { Button } from "@/components/ui/button"
import { spring, type SpringTier } from "@/lib/motion"

/** Each tier moves the same marker; with reduced motion on, the marker jumps instead. */
export function MotionDemo() {
  const [end, setEnd] = useState(false)
  return (
    <div className="grid gap-4">
      <Button variant="outline" className="justify-self-start" onClick={() => setEnd(e => !e)} aria-pressed={end}>
        Play
      </Button>
      <ul className="grid gap-3">
        {(Object.keys(spring) as SpringTier[]).map(tier => (
          <li key={tier} className="grid grid-cols-[6rem_minmax(0,1fr)] items-center gap-3">
            <span className="font-mono text-xs">{tier}</span>
            <div className={`flex h-8 rounded-control bg-muted p-1 ${end ? "justify-end" : "justify-start"}`}>
              <motion.span layout transition={spring[tier]} className="block aspect-square h-full rounded-small bg-primary" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
