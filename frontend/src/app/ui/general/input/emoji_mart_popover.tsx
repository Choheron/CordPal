"use client"

import { Button, Popover, PopoverContent, PopoverTrigger, Tooltip } from "@heroui/react"

// Make use of Emoji Mart from: https://github.com/missive/emoji-mart 
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'

import { useState } from 'react'
import { RiAddCircleFill, RiAddCircleLine, RiAddFill, RiAddLine, RiUserSmileFill, RiUserSmileLine } from 'react-icons/ri'

// An emoji mart picker that pops up when the button is clicked
// Expected Props:
//   - selectionCallback: Function - Custom function call whenever the emoji is sent, will return the whole of the emoji object
//   - buttonClassname: String - Tailwind controls over button
export default function EmojiMartButton(props) {
  // Control hover and open
  const [isHover, setIsHover] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  
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
          onEmojiSelect={props.selectionCallback}
        />
      </PopoverContent>
    </Popover>
  )
}