"use server"

import { getUserAvatarURL, getUserData } from "@/app/lib/user_utils"
import { Avatar } from "@heroui/avatar"
import { Conditional } from "../../dashboard/conditional"

import { Oswald } from 'next/font/google'
// Setup Font
const oswald = Oswald({weight: "400"})

// An award for playback
// Expected Props:
// - title
// - flavor_text
// - stat_text (if applicable)
// - userId (to find Avatar)
// - showNickname
// - emoji
export default async function PlaybackAward(props) {
  const title = (props['title']) ? props['title'] : "UNKNOWN"
  const emoji = (props['emoji']) ? props['emoji'] : "ERR"
  const flavor_text = (props['flavor_text']) ? props['flavor_text'] : ""
  const userData = await getUserData(props.userId)
  const userAvatarURL = await getUserAvatarURL(props.userId)

  return (
    <div className={`rounded-2xl p-5 flex flex-col items-center bg-gradient-to-bl from-slate-900 to-slate-950 ${oswald.className}`}>
      <div className="flex flex-row">
        <p className="text-2xl">{emoji}</p>
        <p className="text-center my-auto text-xl mx-1">{title}</p>
        <p className="text-2xl">{emoji}</p>
      </div>
      <Conditional showWhen={flavor_text != ""}>
        <p className="pb-1 font-light italic">{flavor_text}</p>
      </Conditional>
      <a href={`/profile/${props.userId}`}>
        <Avatar 
          src={userAvatarURL} 
          className="w-40 h-40 text-large"
        />
      </a>
      <Conditional showWhen={props.showNickname}>
        <p className="text-center">{userData['nickname']}</p>
      </Conditional>
      <Conditional showWhen={props.stat_text}>
        {props.stat_text}
      </Conditional>
    </div>
  )
}