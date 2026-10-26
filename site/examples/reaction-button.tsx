"use client"

import { Bookmark, Star, ThumbsUp } from "lucide-react"
import { ReactionButton } from "@/components/ui/reaction-button"

export function Like() {
  return <ReactionButton label="Like" count={12} />
}

export function Reactions() {
  return (
    <>
      <ReactionButton label="Upvote" count={248} icon={<ThumbsUp />} />
      <ReactionButton label="Star" count={1999} icon={<Star />} defaultPressed />
      <ReactionButton label="Save" count={0} icon={<Bookmark />} variant="ghost" />
    </>
  )
}
