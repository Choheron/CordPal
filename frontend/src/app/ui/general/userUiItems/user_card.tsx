'use server'

import {User} from "@nextui-org/user";

import { getUserData, getUserAvatarURL } from "@/app/lib/user_utils";

// GUI Representation for a single user
// Expected Props:
// - userDiscordID: String ID of user being displayed
// - fallbackName: (Optional) String name for if data fetch fails
// - fallbacksrc: (Optional) String image source for if data fetch fails
// - customDescription: (Optional) HTML Code of a custom description
export default async function UserCard(props) {
  const customDesc = (props.customDescription) ? props.customDescription : null;

  try {
    var userData = await getUserData(props.userDiscordID)
    var userAvatarURL = await getUserAvatarURL(props.userDiscordID)
  } catch {
    userData = {"nickname": props.fallbackName}
    userAvatarURL = props.fallbackSrc
  }
  

  return (
    <User   
      className="w-fit"
      name={userData['nickname']}
      description={(
        (props.customDescription) ? props.customDescription : null
      )}
      avatarProps={{
        showFallback: true,
        name: userData['nickname'],
        src: userAvatarURL
      }}
    />
  );
}