"use client"

import { useState, useEffect } from "react"
import CurrentTime from "../general/current_time";
import { Avatar } from "@nextui-org/react";

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

  const constInsetUsersMap = (usersList) => {
    return usersList.map((user, index) => {
      return (
        <div key={index} className={`absolute top-2 right-1 mr-${(index == 0) ? 0 : index+2} z-[${index}]`}>
          <Avatar 
            key={index+2}
            src={user['avatar_url']}
            name={user['nickname']}
            size="sm"
          />
        </div>
      )
    })
  }

  if(timezoneData == null) {
    return <p>No Timezone Data Provided</p>
  }
  return (
    <div className="flex flex-col w-fit gap-2">
      <div  
        className="relative"
      >
        <CurrentTime showDate={true} dateOverride={time} />
        {timezoneData.map((obj, index) => {
          if(obj['timezone'] == userTimezone) {
            return constInsetUsersMap(obj['users'])
          }
        })}
      </div>
      {timezoneData.map((obj, index) => {
        if(!((obj['timezone'] == userTimezone) || (obj['timezone'] == ""))) {
          return (
            <div 
              key={index} 
              className="relative"
            >
              <CurrentTime 
                timezone={obj['timezone']} 
                dateOverride={time} 
                showDate={true}
                titleOverride={`Time for ${obj['users'].length} user(s):`}
              />
              {constInsetUsersMap(obj['users'])}
            </div>
          )
        }
      })}
    </div>
  )
}