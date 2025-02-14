"use client"

import { getAllOnlineData, getUserList } from "@/app/lib/user_utils";
import ClientTimestamp from "../general/client_timestamp"
import UserCard from "../general/userUiItems/user_card"
import { useEffect, useState } from "react";
import { Badge, Spinner, User } from "@nextui-org/react";
import { formatDateString } from "@/app/lib/utils";

// List of online users that is updated every 5 seconds
// Expected Props:
// - userList: List of Users
// - pollingInterval: Number - Number (in seconds) between poll calls
export default function OnlineUsersBox(props) {
  const [userList, setUserList] = useState<any>([])
  const [onlineObject, setOnlineObject] = useState({})
  const [loading, setLoading] = useState(true)
  
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

  // Get online status or return none if failed
  function getStatusColor(onlineObj) {
    if(onlineObj) {
      return `${onlineObj['online'] ? "bg-green-600" : "bg-red-700"}`
    } else {
      return "bg-red-700"
    }
  }


  return(
    <div className="flex flex-row px-2 py-2 min-w-[225px] items-center border-neutral-800 bg-zinc-800/30 from-inherit lg:static lg:w-auto rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:bg-zinc-800/30">
      <div className="flex flex-col gap-1 h-full">
        <p className="mb-2 mx-auto">
          Online Status of Users:
        </p>
        { (loading) ? (
          <Spinner className="h-full" />
        ):(
            userList.sort((a, b) => (a['last_request_timestamp'] < b['last_request_timestamp']) ? 1 : -1).map((userObj, index) => {
              const discord_id = userObj['discord_id']
              return (
                <a 
                  href={`/profile/${props.userDiscordID}`}
                >
                  <Badge
                    className={`absolute top-1 -left-2 ${getStatusColor(onlineObject[discord_id])}`}
                    size="md"
                    content=""
                    shape="circle"
                  >
                    <User
                      className="w-fit"
                      name={userObj['nickname']}
                      description={(
                        <div className="flex">
                          <div className={`w-[8px] h-[8px] ml-0 mr-1 my-auto rounded-full border-1 border-black ${getStatusColor(onlineObject[discord_id])}`}></div>
                          <p>{(onlineObject[discord_id] && onlineObject[discord_id]['online']) ? "Online" : `Seen ${(onlineObject[discord_id]) ? onlineObject[discord_id]['last_seen'] : "--"}`}</p>
                        </div>
                      )}
                      avatarProps={{
                        showFallback: true,
                        name: userObj['nickname'],
                        src: userObj['avatar_url']
                      }}
                    />
                  </Badge>
                </a>
              )
            })
          )
        }
        <p className="mb-2 mx-auto text-xs italic text-gray-500">
          Updates every {props.pollingInterval} seconds
        </p>
      </div>
    </div>
  )
}