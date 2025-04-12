'use server'

import {User} from "@heroui/user";

import { getUserData, getUserAvatarURL, isUserOnline } from "@/app/lib/user_utils";
import { Badge } from "@heroui/react";
import { onlineStatusToTailwindBgColor } from "@/app/lib/utils";

// GUI Representation for a single user
// Expected Props:
// - userDiscordID: String ID of user being displayed
// - fallbackName: (Optional) String name for if data fetch fails
// - fallbacksrc: (Optional) String image source for if data fetch fails
// - customDescription: (Optional) HTML Code of a custom description
// - isProfileLink: Boolean (Optional) [DEFAULT FALSE] - Should the usercard be treated as a link to the user's profile
// - onlineStatusDesc: Boolean (Optional) [DEFAULT FALSE] - Should the description be a check for a users online status? Will appear before custom desc
// - onlineBadge: Boolean (Optional) [DEFAULT FALSE] - Show a dot in the top left signifying if the user is online or not
export default async function UserCard(props) {
  let customDesc = (props.customDescription) ? props.customDescription : null;
  const profileLink = (props.isProfileLink) ? props.isProfileLink : false;
  const showOnlineDot = (props.onlineBadge) ? props.onlineBadge : false;

  try {
    var userData = await getUserData(props.userDiscordID)
    var userAvatarURL = await getUserAvatarURL(props.userDiscordID)
    if(showOnlineDot) {
      var onlineObject = await isUserOnline(props.userDiscordID)
    } else {
      onlineObject = {online: null, status: "offline"}
    }
  } catch {
    userData = {"nickname": props.fallbackName}
    userAvatarURL = props.fallbackSrc
    onlineObject = {online: null, status: "offline"}
  }

  // Overwrite customDesc if user has passed in online status boolean
  customDesc = (props.onlineStatusDesc) ? (
    <div className="flex">
      <div className={`w-[8px] h-[8px] ml-0 mr-1 my-auto rounded-full border-1 border-black ${onlineStatusToTailwindBgColor(onlineObject['status'])}`}></div>
      <p>{(onlineObject['online']) ? (onlineObject['status']) : `Seen ${onlineObject['last_seen']}`}</p>
    </div>
  ) : (
    <div>
      {customDesc}
    </div>
  );


  const user_card = () => (
    <Badge
      className={`absolute top-1 -left-2 ${onlineStatusToTailwindBgColor(onlineObject['status'])}`}
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
          className: "flex-shrink-0"
        }}
        classNames={{
          name: "line-clamp-1"
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