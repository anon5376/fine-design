"use client"

import { useEffect, useState } from "react"
import { Code } from "@/site/example"

/** shadcn install line pointing at this site's own /r/ registry. */
export function InstallCommand({ name }: { name: string }) {
  const [origin, setOrigin] = useState("")
  useEffect(() => setOrigin(window.location.origin), [])
  return <Code code={`npx shadcn@latest add ${origin}/r/${name}.json`} />
}
