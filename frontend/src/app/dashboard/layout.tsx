"use server"

import "@/app/globals.css";
import TopBar from "../ui/dashboard/top_bar";
import { isMember } from "../lib/discord_utils";
import { getUserData, getUserAvatarURL, getUserLoginMethods } from "../lib/user_utils";
import CordpalPlaybackBanner from "../ui/playback/general/conditional_playback_banner";
import { getAotdUserSettings, isAotdParticipant } from "../lib/aotd_utils";


export default async function Layout({ children }: { children: React.ReactNode }) {
  // Retrieve user data
  const [userData, userLoginMethods, memberStatus, avatarURL, aotdConnected] = await Promise.all([
    getUserData(),
    getUserLoginMethods(),
    isMember(),
    getUserAvatarURL(),
    isAotdParticipant()
  ]);
  // Retrieve aotd settings if the user is a participant
  const aotdSettings = (aotdConnected) ? (await getAotdUserSettings()) : (null)

  // Create linked accounts object and add path to branding avatar
  let linkedAccounts: any[] = []
  let discordData = {}
  discordData['data'] = {"display_name": userData['username']}
  discordData['branding_name'] = "Discord"
  discordData['branding_avatar_path'] = '/images/branding/Discord-Symbol-Blurple.svg'
  linkedAccounts.push(discordData)

  return (
    <div className="relative">
      <CordpalPlaybackBanner />
      <TopBar 
        userInfo={userData} 
        aotdConnected={aotdConnected} 
        aotdSettings={aotdSettings}
        userLoginMethods={userLoginMethods} 
        isMember={memberStatus} 
        avatarURL={avatarURL} 
        linkedAccounts={linkedAccounts}
      />
      {children}
    </div>
  );
}
