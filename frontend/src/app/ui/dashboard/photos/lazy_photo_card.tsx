'use client'

// LazyPhotoCard - Intersection Observer wrapper for PhotoModal
//
// PURPOSE:
//   Without this component, PhotoGallery mounts ALL PhotoModal components immediately,
//   each of which renders a HeroUI <Image> with a live src. The browser fires off
//   HTTP requests for every single image the moment the page loads, regardless of
//   whether the user can see them.
//
//   This component solves that by acting as a "gate": it renders a cheap skeleton
//   placeholder until the card is about to enter the viewport, then swaps in the
//   real PhotoModal. The native IntersectionObserver API drives this — no extra
//   dependencies needed.
//
// HOW rootMargin WORKS:
//   rootMargin: '200px' extends the effective viewport by 200px on all sides.
//   This means the PhotoModal starts mounting when the skeleton is 200px below
//   the visible area — giving the image a head start before the user reaches it,
//   preventing any visible gap or pop-in while scrolling.
//
// Expected Props:
//  - imageSrc: String - Full path to the image API endpoint
//  - imageID:  String - Database GUID for this image, passed through to PhotoModal

import { useEffect, useRef, useState } from 'react'
import PhotoModal from './photo_modal'

export default function LazyPhotoCard({ imageSrc, imageID }: { imageSrc: string; imageID: string }) {
  // Ref attached to the skeleton div — this is what the observer watches
  const ref = useRef<HTMLDivElement>(null)
  // Once true, replace the skeleton with the real PhotoModal (never goes back to false)
  const [shouldRender, setShouldRender] = useState(false)
  // Drives the fade-in: starts false so the card renders at opacity-0, then
  // flips to true on the next tick to trigger the CSS transition
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Card is close enough to the viewport — mount the real component
          setShouldRender(true)
          // Disconnect immediately: we only ever need to observe once per card
          observer.disconnect()
        }
      },
      {
        // Load 200px before the card enters the visible area so images are ready
        // before the user actually reaches them
        rootMargin: '200px',
      }
    )

    if (ref.current) observer.observe(ref.current)

    // Cleanup: if the component unmounts before firing, disconnect the observer
    return () => observer.disconnect()
  }, [])

  // Trigger the fade-in transition one tick after shouldRender becomes true.
  // We can't set both in the same tick because the element needs one render cycle
  // at opacity-0 before the transition has anything to animate from.
  useEffect(() => {
    if (!shouldRender) return
    const t = setTimeout(() => setIsVisible(true), 10)
    return () => clearTimeout(t)
  }, [shouldRender])

  // --- Skeleton state ---
  // Rendered while the card has not yet approached the viewport.
  // aspect-[3/4] gives a sensible portrait placeholder shape matching typical photo
  // dimensions. animate-pulse provides a subtle shimmer to indicate content is coming.
  // The ref must stay on this element so the observer has something to watch.
  if (!shouldRender) {
    return (
      <div
        ref={ref}
        className="w-full aspect-[3/4] rounded-xl bg-zinc-800/50 animate-pulse"
      />
    )
  }

  // --- Active state ---
  // Wraps PhotoModal in a fade-in container. opacity-0 → opacity-100 over 500ms
  // once isVisible flips, giving a smooth appearance instead of a hard pop-in.
  // The ref is no longer needed here (observer already disconnected).
  return (
    <div className={`transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <PhotoModal imageSrc={imageSrc} imageID={imageID} />
    </div>
  )
}
