"use client"

import { useState, useEffect } from "react"
import CurrentTime from "../general/current_time";

// Display all user timezone data in a vertically stacked block
// Expected Props:
//  - timezoneData: Object - Timezone data from a backend call to "getUsersByTimezone"
export default function AllTimezonesBlock(props) {
  const [time, setTime] = useState(new Date());
  const timezoneData = (props.timezoneData) ? props.timezoneData : null
  const userTimezone = new Intl.DateTimeFormat().resolvedOptions().timeZone

  // Update date every second
  useEffect(() => {
    var timer = setInterval(() => setTime(new Date()), 1000);

    // Cleanup Function
    return function cleanup() {
      clearInterval(timer)
    }
  }, [])

  if(timezoneData == null) {
    return <p>No Timezone Data Provided</p>
  }
  return (
    <div className="flex flex-col w-fit gap-2">
      <CurrentTime showDate={true} dateOverride={time} />
      {timezoneData.map((obj, index) => {
        if((obj['timezone'] == userTimezone) || (obj['timezone'] == "")) {
          return null
        }
        return (
          <CurrentTime 
            key={index} 
            timezone={obj['timezone']} 
            dateOverride={time} 
            showDate={true}
            titleOverride={`Time for ${obj['users'].length} user(s):`}
          />
        )
      })}
    </div>
  )
}