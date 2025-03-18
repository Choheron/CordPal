"use client"

import { useEffect, useState } from "react"
import { padNumber } from "@/app/lib/utils"

// Display the user's current time and timezone
// This will need to run on the clientside
// Expected Props:
//  - military: Boolean - Show 24 hour clock if true or 12 hour clock if false, defaults to FALSE.
//  - timezone: String - Timezone string for the clock time, if not provided will use client timezone
//  - basic: Boolean - Will return a basic Date.toLocaleString() call that updates every second
//  - showDate: Boolean - Will show date in the bottom left if basic is not true. 
//  - dateOverride: Date - (OPTIONAL) A date override that allows us to avoid setting up an interval in this instance. 
export default function CurrentTime(props) {
  const formatString = (props.military) ? "en-EU" : "en-US";
  const timezone = (props.timezone) ? props.timezone : new Intl.DateTimeFormat().resolvedOptions().timeZone;
  const basic = (props.basic) ? props.basic : false;
  const showDate = (props.showDate) ? props.showDate : false;
  const titleOverride = (props.titleOverride) ? props.titleOverride : null;
  // Time object
  const [time, setTime] = useState(((props.dateOverride) ? 
                          "" :  /* This is empty because later in this file I reference the prop directly so that the children update with the passed in date. */
                          new Date().toLocaleString(formatString, { timeZone: timezone})
                        ))
  // Broken Down Objects
  const [date, setDate] = useState("0000/00/00")
  const [hours, sethours] = useState("00")
  const [mins, setMins] = useState("00")
  const [seconds, setSeconds] = useState("00")
  const [postFix, setPostFix] = useState("AM")

  useEffect(() => {
    if(props.dateOverride == null) {
      var timer = setInterval(() => setTime(new Date().toLocaleString(formatString, { timeZone: timezone})), 1000);

      // Cleanup Function
      return function cleanup() {
        clearInterval(timer)
      }
    }
  }, [])

  // Second useEffect to update time every time a new time is set
  useEffect(() => {
    const arr1 = (props.dateOverride) ? props.dateOverride.toLocaleString(formatString, { timeZone: timezone}).split(" ") : time.split(" ")
    const arr2 = arr1[1].split(":")

    setDate(arr1[0].substring(0, arr1[0].length - 1))
    sethours(arr2[0])
    setMins(arr2[1])
    setSeconds(arr2[2])
    setPostFix(arr1[2])
  }, [time, props.dateOverride])

  if(basic) {
    return (
      <p suppressHydrationWarning>{time}</p>
    )
  }
  return (
    <div className="flex flex-col w-fit h-fit px-2 py-2 border-neutral-800 bg-zinc-800/30 rounded-xl border font-extralight">
      <p>{((titleOverride) ? titleOverride : "Your Current Time: ")}</p>
      <div className="text-6xl min-w-[400px] px-5">
        <div className="flex w-full py-3">
          <div className="flex w-full">
            <p className="w-1/3 text-center">{padNumber(hours)}</p>
            <p>:</p>
            <p className="w-1/3 text-center">{padNumber(mins)}</p>
            <p>:</p>
            <p className="w-1/3 text-center" suppressHydrationWarning>{padNumber(seconds)}</p>
          </div>
          <p>{((props.military) ? "" : postFix)}</p>
        </div>
      </div>
      <div className="w-full flex justify-between">
        <p>{((showDate) ? date : "")}</p>
        <p>{timezone}</p>
      </div>
    </div>
  )
}