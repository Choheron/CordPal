import {User} from "@nextui-org/user";

import { getUserData, getUserAvatarURL } from "@/app/lib/user_utils";

// GUI Representation for a single user
// Expected Props:
// - userDiscordID: String ID of user being displayed
export default async function UserCard(props) {
  const userData = await getUserData(props.userDiscordID)
  const userAvatarURL = await getUserAvatarURL(props.userDiscordID)

  return (
    <User   
      className="w-full"
      name={userData['nickname']}
      avatarProps={{
        src: userAvatarURL
      }}
    />
  );
}