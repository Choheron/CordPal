'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function ReviewEventSource({ albumId }: { albumId: string }) {
  const router = useRouter()

  useEffect(() => {
    const es = new EventSource(`/dashboard/aotd/api/review-events?album_id=${albumId}`)
    es.onmessage = () => router.refresh()
    return () => es.close()
  }, [albumId, router])

  return null
}