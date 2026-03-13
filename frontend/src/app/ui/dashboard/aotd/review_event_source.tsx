'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'

export default function ReviewEventSource({ albumId }: { albumId: string }) {
  const router = useRouter()
  const isEditingRef = useRef(false)

  useEffect(() => {
    const handler = (e: CustomEvent<{ isEditing: boolean }>) => {
      isEditingRef.current = e.detail.isEditing
    }
    window.addEventListener('reviewEditingChanged', handler as EventListener)
    return () => window.removeEventListener('reviewEditingChanged', handler as EventListener)
  }, [])

  useEffect(() => {
    const es = new EventSource(`/dashboard/aotd/api/review-events?album_id=${albumId}`)
    es.onmessage = () => {
      if (!isEditingRef.current) router.refresh()
    }
    return () => es.close()
  }, [albumId, router])

  return null
}