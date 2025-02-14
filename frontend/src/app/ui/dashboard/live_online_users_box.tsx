"use client"

import ClientUserCard from "../general/userUiItems/client_user_card"

// List of online users that is updated every 5 seconds
// Expected Props:
// - userList: List of Users
export default function LiveOnlineUsersBox(props) {
  const userList = props.userList

  return(
    <div className="flex flex-row px-2 py-2 min-w-[225px] items-center border-neutral-800 bg-zinc-800/30 from-inherit lg:static lg:w-auto rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:bg-zinc-800/30">
      <div className="flex flex-col gap-1 h-full">
        <p className="mb-2 mx-auto">
          Live Status of Users:
        </p>
        { 
          userList.sort((a, b) => (a['last_request_timestamp'] < b['last_request_timestamp']) ? 1 : -1).map((userObj, index) => {
            return (
              <ClientUserCard
                className="mb-2"
                key={index}
                userDiscordID={userObj['discord_id']}
                isProfileLink
                onlineStatusDesc
              />
            )
          })
        }
      </div>
    </div>
  )
}