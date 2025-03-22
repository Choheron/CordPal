"use client"

import { getAllOnlineData, getUserList } from "@/app/lib/user_utils";
import { useEffect, useState } from "react";
import { Badge, Spinner, User } from "@nextui-org/react";
import { onlineStatusToTailwindBgColor } from "@/app/lib/utils";

// List of online users that is updated every 5 seconds
// Expected Props:
// - userList: List of Users
// - onlineData: Object of online statuses
// - pollingInterval: Number - Number (in seconds) between poll calls
export default function OnlineUsersBox(props) {
  const [userList, setUserList] = useState<any>((props.userList) ? props.userList : [])
  const [onlineObject, setOnlineObject] = useState((props.onlineData) ? props.onlineData : {})
  const [loading, setLoading] = useState((props.userList && props.onlineData) ? false : true)
  
  // Get user data
  const getUserData = async() => {
    setUserList(await getUserList())
  }
  // Get all user online status and info
  const getUserOnlineData = async() => {
    setOnlineObject(await getAllOnlineData())
  }
  // Setup polling for client timestamps
  useEffect(() => {
    getUserData()
    getUserOnlineData()

    const intervalId = setInterval(() => {
      getUserOnlineData();
    }, (props.pollingInterval * 1000));

    return () => clearInterval(intervalId); // Clean up the interval on component unmount
  }, [])

  // Toggle loading once onlineObject is defined
  useEffect(() => {
    setLoading(Object.keys(onlineObject).length == 0)
  }, [onlineObject])

  // Custom sort method for users
  function userSort(a, b) {
    let sum = 0

    // Online users 
    if(a["online"] == "true") {
      sum -= 2
    }
    if(b["online"] == "true") {
      sum -= 2
    }
    // Away Users
    if(a["status"] == "Away") {
      sum -= 1
    }
    if(b["status"] == "Away") {
      sum -= 1
    }
    (a['last_request_timestamp'] < b['last_request_timestamp']) ? sum += 1 : sum -= 1;

    return sum
  }


  return(
    <div className="flex flex-row px-2 py-2 min-w-[225px] items-center border-neutral-800 bg-zinc-800/30 from-inherit lg:static lg:w-auto rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:bg-zinc-800/30">
      <div className="flex flex-col gap-1 h-full">
        <p className="mb-2 mx-auto">
          Online Status of Users:
        </p>
        <div className="flex flex-col h-full w-full">
          { (loading) ? (
            <Spinner className="w-full h-full" />
          ):(
              userList.sort((a, b) => userSort(a, b)).map((userObj, index) => {
                const discord_id = userObj['discord_id']
                return (
                  <a 
                    href={`/profile/${discord_id}`}
                    key={index}
                  >
                    <User
                      className="w-fit"
                      name={userObj['nickname']}
                      description={(
                        <div className="flex">
                          <div className={`w-[8px] h-[8px] ml-0 mr-1 my-auto rounded-full border-1 border-black ${onlineStatusToTailwindBgColor(onlineObject[discord_id]['status'])}`}></div>
                          <p>{(onlineObject[discord_id] && onlineObject[discord_id]['online']) ? onlineObject[discord_id]['status'] : `Seen ${(onlineObject[discord_id]) ? onlineObject[discord_id]['last_seen'] : "--"}`}</p>
                        </div>
                      )}
                      avatarProps={{
                        showFallback: true,
                        name: userObj['nickname'],
                        src: userObj['avatar_url']
                      }}
                    />
                  </a>
                )
              })
            )
          }
        </div>
        <p className="mb-2 mx-auto text-xs italic text-gray-500">
          Updates every {props.pollingInterval} seconds
        </p>
      </div>
    </div>
  )
}