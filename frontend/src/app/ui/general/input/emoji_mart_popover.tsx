"use client"

import { Button, Popover, PopoverContent, PopoverTrigger, Tooltip } from "@heroui/react"

// Make use of Emoji Mart from: https://github.com/missive/emoji-mart 
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'

import { useState, useEffect } from 'react'
import { RiAddCircleFill, RiAddCircleLine, RiAddFill, RiAddLine, RiUserSmileFill, RiUserSmileLine } from 'react-icons/ri'
import { recordEmojiUse } from "@/app/lib/emoji_utils"

// An emoji mart picker that pops up when the button is clicked
// Expected Props:
//   - selectionCallback: Function - Custom function call whenever the emoji is sent, will return the whole of the emoji object
//   - buttonClassname: String - Tailwind controls over button
export default function EmojiMartButton(props) {
  // Control hover and open
  const [isHover, setIsHover] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  // Custom Emojis — typed explicitly so emojis: any[] rather than never[]
  const [customEmojis, setCustomEmojis] = useState<{ id: string; name: string; emojis: any[] }[]>([
    { id: 'custom', name: 'Custom', emojis: [] }
  ])

  useEffect(() => {
    // Fetch client-side — session cookie sent automatically with credentials: 'include'
    fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/emojis/list/`, {
      credentials: 'include'
    })
      .then(r => r.json())
      .then(emojiData => {
        setCustomEmojis([{ id: 'custom', name: 'Custom', emojis: emojiData.emojis }])
      })
      .catch(() => {}) // Degrade gracefully — picker still works without custom emojis
  }, [])

  // Emoji Categories
  const categories = [
    "frequent", 
    "custom",
    "people", 
    "nature", 
    "foods", 
    "activity", 
    "places", 
    "objects", 
    "symbols", 
    "flags"
  ]

  // Selection Callback Wrapper for Custom Emojis
  const handleEmojiSelect = (emojiObj) => {
    // If it's a custom emoji, find the emoji_id and record use
    if (emojiObj.src) {
      const match = customEmojis[0]?.emojis?.find(e => e.skins?.[0]?.src === emojiObj.src)
      if (match?.emoji_id) {
        recordEmojiUse(match.emoji_id).catch(() => {})  // Server action, fire-and-forget
      }
    }
    props.selectionCallback(emojiObj)  // Original callback unchanged
    setIsOpen(false)
  }

  
  return (
    <Popover
      isOpen={isOpen}
      onOpenChange={(open) => setIsOpen(open)}
    >
      <PopoverTrigger>
        <Button
          variant="solid"
          radius='full'
          className="text-2xl p-1 w-fit h-fit min-w-0 min-h-0 m-1 bg-gray-700 hover:bg-gray-500 overflow-visible"
          onMouseEnter={() => setIsHover(true)}
          onMouseLeave={() => setIsHover(false)}
          isDisabled={props.isDisabled}
        >
          <div className="relative w-fit h-fit">
            {(isHover || isOpen) ?(<RiUserSmileFill />):(<RiUserSmileLine />) }
            <div className="absolute z-50 -top-2 -right-3 text-sm bg-gray-700 group-hover:bg-gray-500 rounded-full p-[2px]">
            {(isHover || isOpen) ?(<RiAddCircleFill />):(<RiAddCircleLine />) }
            </div>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <Picker
          data={data}
          onEmojiSelect={handleEmojiSelect}
          custom={customEmojis}
          categories={categories}
        />
      </PopoverContent>
    </Popover>
  )
}