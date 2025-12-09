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
  // Custom Emojis
  const custom = [
    {
      id: 'custom',
      name: 'Custom',
      emojis: [
        {
          id: 'tfw',
          name: 'TFW',
          keywords: ['tfw', 'knee surgery'],
          skins: [{ src: 'https://cdn.discordapp.com/emojis/1310014250789371976.webp?size=40' }],
        },
        {
          id: 'dogi',
          name: 'Dogi',
          keywords: ['dogi', 'dog', 'sad'],
          skins: [{ src: 'https://cdn.discordapp.com/emojis/1430310636742774904.webp?size=40' }],
        },
        {
          id: 'skynik',
          name: 'Soynik',
          keywords: ['soy', 'nik', 'jak'],
          skins: [{ src: 'https://cdn.discordapp.com/emojis/1375613103089254461.webp?size=40' }],
        },
        {
          id: 'cringe',
          name: 'Cringe',
          keywords: ['cringe'],
          skins: [{ src: 'https://cdn.discordapp.com/emojis/1367864039639744523.webp?size=40' }],
        },
        {
          id: 'propRat',
          name: 'Propeller Rat',
          keywords: ['rat', 'propellar', 'propellarRat'],
          skins: [{ src: 'https://cdn.discordapp.com/emojis/1410019637579485344.webp?size=40' }],
        },
        {
          id: 'laughing_rat',
          name: 'Laughing Rat',
          keywords: ['rat', 'laugh', 'joy', 'funny'],
          skins: [{ src: 'https://cdn.discordapp.com/emojis/683873459834454031.webp?size=40' }],
        },
        {
          id: 'gigachad',
          name: 'Gigachad',
          keywords: ['gigachad', 'giga', 'chad'],
          skins: [{ src: 'https://cdn.discordapp.com/emojis/926282130890293298.webp?size=40' }],
        },
      ],
    }
  ]
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
          custom={custom}
          categories={categories}
        />
      </PopoverContent>
    </Popover>
  )
}