export type AlbumTag = {
  id: number
  tag_text: string
  submitted_by: string | null
  submitted_by_id: string | null
  submitted_at: string
  is_approved: boolean
  net_score: number
  upvotes: number
  downvotes: number
  user_vote: 1 | -1 | null
}