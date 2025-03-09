"use client"

import { useEffect, useState } from "react"
import { padNumber } from "@/app/lib/utils"

// Display the user's current time and timezone
// This will need to run on the clientside
// Expected Props:
//  - military: Boolean - Show 24 hour clock if true or 12 hour clock if false, defaults to FALSE.
export default function CurrentTime(props) {
  const [time, setTime] = useState(new Date())
  const militaryTime = (props.military) ? props.military : false;

  useEffect(() => {
    var timer = setInterval(() => setTime(new Date()), 1000);

    // Cleanup Function
    return function cleanup() {
      clearInterval(timer)
    }
  }, [])

  const getHours = () => {
    if(militaryTime) {
      return time.getHours()
    }
    return (time.getHours() > 12) ? time.getHours()-12 : time.getHours()
  }

  return (
    <div className="flex flex-col w-fit h-fit px-2 py-2 border-neutral-800 bg-zinc-800/30 rounded-xl border font-extralight">
      <p>Current Time: </p>
      <div className="text-6xl min-w-[400px] px-5">
        <div className="flex w-full py-3">
          <div className="flex w-full">
            <p className="w-1/3 text-center">{padNumber(getHours())}</p>
            <p>:</p>
            <p className="w-1/3 text-center">{padNumber(time.getMinutes())}</p>
            <p>:</p>
            <p className="w-1/3 text-center" suppressHydrationWarning>{padNumber(time.getSeconds())}</p>
          </div>
          <p>{(militaryTime) ? "" : time.toLocaleTimeString().substring(time.toLocaleTimeString().length-2)}</p>
        </div>
      </div>
      <p className="w-full text-right">
        {new Intl.DateTimeFormat().resolvedOptions().timeZone}
      </p>
    </div>
  )
}