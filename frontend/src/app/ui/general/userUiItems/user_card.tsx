'use server'

import {User} from "@nextui-org/user";

import { getUserData, getUserAvatarURL, isUserOnline } from "@/app/lib/user_utils";
import Link from "next/link";
import { Button } from "@nextui-org/react";

// GUI Representation for a single user
// Expected Props:
// - userDiscordID: String ID of user being displayed
// - fallbackName: (Optional) String name for if data fetch fails
// - fallbacksrc: (Optional) String image source for if data fetch fails
// - customDescription: (Optional) HTML Code of a custom description
// - isProfileLink: Boolean (Optional) [DEFAULT FALSE] - Should the usercard be treated as a link to the user's profile
// - onlineStatusDesc: Boolean (Optional) [DEFAULT FALSE] - Should the description be a check for a users online status? Will appear before custom desc
export default async function UserCard(props) {
  let customDesc = (props.customDescription) ? props.customDescription : null;
  const profileLink = (props.isProfileLink) ? props.isProfileLink : false;

  try {
    var userData = await getUserData(props.userDiscordID)
    var userAvatarURL = await getUserAvatarURL(props.userDiscordID)
    var onlineObject = await isUserOnline(props.userDiscordID)
  } catch {
    userData = {"nickname": props.fallbackName}
    userAvatarURL = props.fallbackSrc
  }

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
    <User
      className="w-fit"
      name={userData['nickname']}
      description={(
        customDesc
      )}
      avatarProps={{
        showFallback: true,
        name: userData['nickname'],
        src: userAvatarURL
      }}
    />
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