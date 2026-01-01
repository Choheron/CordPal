"use server"

import { isPlaybackAvailable } from "@/app/lib/playback_utils"
import { isJanuary } from "@/app/lib/utils"
import { Conditional } from "../../dashboard/conditional";

import { BBH_Sans_Bartle } from 'next/font/google'
// Setup Font
const bartle = BBH_Sans_Bartle({weight: "400"})

export default async function CordpalPlaybackBanner(props) {
  const today = new Date();

  const isJan = isJanuary()
  const globalPlaybackAvailable = await isPlaybackAvailable(today.getFullYear() - 1)

  return (
    <div className="hidden md:block fixed bottom-2 right-2 z-20">
      {/* Banner showing if global cordpal playback is available for last year*/}
      <Conditional showWhen={isJan && globalPlaybackAvailable}>
        <a
          href={`/playback/${today.getFullYear() - 1}`}
        >
          <div className={`p-5 relative flex align-middle items-center snap-start bg-gradient-to-bl from-violet-600 to-purple-900 rounded-2xl ${bartle.className}`}>
            <div className="mx-auto">
              <p className="mx-auto text-2xl">CordPal Playback</p>
              <p className="text-right text-xl text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-green-500 to-indigo-400">{today.getFullYear() - 1}</p>
            </div>
            <p className={`${bartle.className} absolute bottom-1 left-2`}>Now Available</p>
          </div>
        </a>
      </Conditional>
    </div>
  )
}