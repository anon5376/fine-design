"use client"

import { useState } from "react"
import { Tag, TagList } from "@/components/ui/tag"

export function Static() {
  return (
    <>
      <Tag>Ethereum</Tag>
      <Tag>Base</Tag>
      <Tag>Arbitrum</Tag>
    </>
  )
}

export function Removable() {
  const [tags, setTags] = useState(["Over $10k", "Last 30 days", "Outgoing"])
  return (
    <TagList className="w-full justify-center">
      {tags.map(tag => (
        <Tag key={tag} onRemove={() => setTags(t => t.filter(x => x !== tag))}>
          {tag}
        </Tag>
      ))}
    </TagList>
  )
}
