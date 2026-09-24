"use client"

import { Popover, PopoverTrigger, PopoverContent } from "@heroui/popover"
import { useEffect, useRef, useState } from "react"

import { markReviewViewed } from "@/app/lib/aotd_utils"

// Green flags a review this user has never opened, orange one edited since they last did
const indicatorFor = (viewData) => {
  if(!viewData['viewed']) return "bg-green-500"
  return (viewData['updated']) ? "bg-orange-500" : ""
}

// Wrapper to mark a review as viewed when the user opens its popover
// Expected Props:
//  - reviewId: String - Review ID (PK from backend)
//  - viewData: Object - Backend view status ({viewed, updated})
//  - trigger: Node - Server rendered review card
//  - children: Node - Server rendered popover content
export default function ReviewViewPopoverWrapper(props) {
  const [indicator, setIndicator] = useState(indicatorFor(props.viewData))
  const marked = useRef(false)

  // useState() only seeds from props on mount. The SSE stream triggers router.refresh(), which
  // re-renders parent Server Component with fresh view data - this component stays mounted
  // and would otherwise show the mount-time indicator forever. Skip the re-sync once the user
  // has opened this card, so an in-flight refresh can't resurrect the dot we just cleared.
  useEffect(() => {
    if(marked.current) return
    setIndicator(indicatorFor(props.viewData))
  }, [props.viewData])

  // Only fire once per mount - reopening the same card shouldn't re-hit the backend
  const handleOpenChange = (isOpen) => {
    if(!isOpen || marked.current) return
    marked.current = true
    setIndicator("")
    markReviewViewed(props.reviewId)
  }

  return (
    <Popover
      placement="bottom"
      showArrow={true}
      shouldCloseOnScroll={false}
      onOpenChange={handleOpenChange}
    >
      <PopoverTrigger>
        <div className="relative transition-all hover:bg-black/40 hover:scale-105">
          {/* New Content indicator */}
          <div className={`absolute -top-1 -left-1 ${indicator} size-3 rounded-full z-10`} />
          {props.trigger}
        </div>
      </PopoverTrigger>
      <PopoverContent className="relative w-[330px] max-h-dvh">
        {props.children}
      </PopoverContent>
    </Popover>
  )
}
