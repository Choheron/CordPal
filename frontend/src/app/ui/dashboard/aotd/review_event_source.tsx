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
    let es: EventSource | null = null

    const connect = () => {
      // Close any existing connection before opening a new one — avoids duplicate listeners
      // if connect() is called while a previous EventSource is still open (e.g. rapid tab switches)
      es?.close()
      es = new EventSource(`/dashboard/aotd/api/review-events?album_id=${albumId}`)
      es.onmessage = () => {
        if (!isEditingRef.current) router.refresh()
      }
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        // When the tab comes back into focus, the SSE connection may have silently died.
        // Browsers throttle/suspend background tabs, which can drop the connection without
        // firing an error event — so EventSource's built-in auto-reconnect never triggers.
        // We force a refresh to catch any missed events, then re-establish a fresh connection.
        router.refresh()
        connect()
      }
    }

    connect()
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      es?.close()
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [albumId, router])

  return null
}