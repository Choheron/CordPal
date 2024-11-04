import {User} from "@nextui-org/user";

import { getUserData, getUserAvatarURL } from "@/app/lib/user_utils";

// GUI Representation for a single user
// Expected Props:
// - userDiscordID: String ID of user being displayed
// - fallbackName: (Optional) String name for if data fetch fails
export default async function UserCard(props) {
  
  try {
    var userData = await getUserData(props.userDiscordID)
    var userAvatarURL = await getUserAvatarURL(props.userDiscordID)
  } catch {
    userData = {"nickname": props.fallbackName}
    userAvatarURL = props.fallbackSrc
  }
  

  return (
    <User   
      className="w-full"
      name={userData['nickname']}
      avatarProps={{
        showFallback: true,
        name: userData['nickname'],
        src: userAvatarURL
      }}
    />
  );
}