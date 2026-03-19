export type TagSuggestion = {
  text: string
  emoji: string | null
}

export type GlobalTag = {
  id: number
  text: string
  emoji: string | null
  created_at: string
}

export type AlbumTag = {
  id: number
  tag_text: string
  emoji: string | null
  submitted_by: string | null
  submitted_by_id: string | null
  submitted_at: string
  is_approved: boolean
  net_score: number
  upvotes: number
  downvotes: number
  user_vote: 1 | -1 | null
}