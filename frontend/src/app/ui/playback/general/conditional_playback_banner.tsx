"use client"

import { isPlaybackAvailable } from "@/app/lib/playback_utils"
import { isJanuary } from "@/app/lib/utils"
import { Conditional } from "../../dashboard/conditional";

import { BBH_Sans_Bartle } from 'next/font/google'
import { useEffect, useState } from "react";
import { RiCloseCircleFill } from "react-icons/ri";
// Setup Font
const bartle = BBH_Sans_Bartle({weight: "400"})

export default function CordpalPlaybackBanner(props) {
  const today = new Date();
  const isJan = isJanuary()
  const [closed, setClosed] = useState(false)
  const [globalPlaybackAvailable, setGlobalPlaybackAvailable] = useState(false)

  const handleCloseClick = () => {
    setClosed(true)
  }
  
  // UseEffect to check if 
  useEffect(() => {
    const checkAvailable = async () => {
      setGlobalPlaybackAvailable(await isPlaybackAvailable(today.getFullYear() - 1))
    }
    checkAvailable()
  },[])

  // Animated background tailwind
  const animatedGradientTW = "animate-gradient-move bg-size-200 bg-gradient-to-tr from-violet-600 from-30% via-purple-800 via-50% to-violet-600 to-80%"

  return (
    <div className={`transition-all duration-500 ease-in-out ${(isJan && globalPlaybackAvailable && !closed) ? 'opacity-100 visible' : 'opacity-0 invisible'} md:block fixed bottom-2 right-2 z-20`}>
      {/* Banner showing if global cordpal playback is available for last year*/}
      <div className="relative">
        {/* Close Icon */}
        <RiCloseCircleFill 
          className="text-2xl absolute -top-2 -left-2 hover:scale-125 transition-all ease-in-out z-10"
          onClick={handleCloseClick}
        />
        <a
          href={`/playback/${today.getFullYear() - 1}`}
        >
          <div className={`p-5 relative flex align-middle items-center snap-start ${animatedGradientTW} rounded-2xl ${bartle.className}`}>
            {/* Popup Text */}
            <div className="mx-auto">
              <p className="mx-auto text-2xl">CordPal Playback</p>
              <p className="text-right text-xl text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-green-500 to-indigo-400">{today.getFullYear() - 1}</p>
            </div>
            <p className={`${bartle.className} absolute bottom-1 left-2`}>Now Available</p>
          </div>
        </a>
      </div>
    </div>
  )
}