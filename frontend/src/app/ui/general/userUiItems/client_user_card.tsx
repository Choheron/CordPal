'use client'

import {User} from "@nextui-org/user";

import { getUserData, getUserAvatarURL, isUserOnline } from "@/app/lib/user_utils";
import { Badge } from "@nextui-org/react";
import { useEffect, useState } from "react";

// GUI Representation for a single user [CLIENT VERSION]
// Expected Props:
// - userDiscordID: String ID of user being displayed
// - fallbackName: (Optional) String name for if data fetch fails
// - fallbacksrc: (Optional) String image source for if data fetch fails
// - customDescription: (Optional) HTML Code of a custom description
// - isProfileLink: Boolean (Optional) [DEFAULT FALSE] - Should the usercard be treated as a link to the user's profile
// - onlineStatusDesc: Boolean (Optional) [DEFAULT FALSE] - Should the description be a check for a users online status? Will appear before custom desc
// - onlineBadge: Boolean (Optional) [DEFAULT FALSE] - Show a dot in the top left signifying if the user is online or not
export default function ClientUserCard(props) {
  let customDesc = (props.customDescription) ? props.customDescription : null;
  const profileLink = (props.isProfileLink) ? props.isProfileLink : false;
  const showOnlineDot = (props.onlineBadge) ? props.onlineBadge : false;
  // Defaults for when fetching
  const fallbackName = (props.fallbackName) ? props.fallbackName : "username";
  // States
  const [userData, setUserData] = useState({"nickname": fallbackName});
  const [userAvatarURL, setUserAvatarURL] = useState(props.fallbackSrc);
  const [onlineObject, setOnlineObject] = useState({online: null, last_seen: "--"});
  // Refresh tracking
  const [lastPoll, setLastPoll] = useState(new Date())

  // On load get username, profile picture, and setup intercal for status fetching
  useEffect(() => {
    const queryData = async () => {
      setUserData(await getUserData(props.userDiscordID))
      setUserAvatarURL(await getUserAvatarURL(props.userDiscordID))
      setOnlineObject(await isUserOnline(props.userDiscordID))
    }
    queryData()
    
    const interval = setInterval(() => {
      setLastPoll(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, [])

  // On update of lastPoll timestamp, query for user online data
  useEffect(() => {
    const queryOnlineStatus = async () => {
      setOnlineObject(await isUserOnline(props.userDiscordID))
    }
    queryOnlineStatus()
  }, [lastPoll])


  // Overwrite customDesc if user has passed in online status boolean
  customDesc = (props.onlineStatusDesc) ? (
    <div className="flex">
      <div className={`w-[8px] h-[8px] ml-0 mr-1 my-auto rounded-full border-1 border-black ${onlineObject['online'] ? "bg-green-600" : "bg-red-700"}`}></div>
      <p>{(onlineObject['online']) ? "Online" : `Seen ${onlineObject['last_seen']}`}</p>
    </div>
  ) : (
    <div>
      {customDesc}
    </div>
  );


  const user_card = () => (
    <Badge
      className={`absolute top-1 -left-2 ${onlineObject['online'] ? "bg-green-600" : "bg-red-700"}`}
      size="md"
      content=""
      shape="circle"
      isInvisible={!showOnlineDot}
    >
      <User
        className="w-fit"
        name={userData['nickname']}
        description={(
          customDesc
        )}
        avatarProps={{
          showFallback: true,
          name: userData['nickname'],
          src: userAvatarURL,

        }}
      />
    </Badge>
  )

  if(profileLink) {
    return(
      <a 
        href={`/profile/${props.userDiscordID}`}
      >
        {user_card()}
      </a>
    );
  } else {
    return (user_card());
  }
}