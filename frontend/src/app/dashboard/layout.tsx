"use server"

import "@/app/globals.css";
import TopBar from "../ui/dashboard/top_bar";
import { isMember } from "../lib/discord_utils";
import { getUserData, getUserAvatarURL, getUserLoginMethods } from "../lib/user_utils";
import { getSpotifyData } from "../lib/spotify_utils";



export default async function Layout({ children }: { children: React.ReactNode }) {
  // Retrieve user data
  const userData = await getUserData();
  const userLoginMethods = await getUserLoginMethods();
  const memberStatus = (await isMember());
  const avatarURL = await getUserAvatarURL();
  const spotifyData = await getSpotifyData();

  // Create linked accounts object and add path to branding avatar
  let linkedAccounts: any[] = []
  let discordData = {}
  discordData['data'] = {"display_name": userData['username']}
  discordData['branding_name'] = "Discord"
  discordData['branding_avatar_path'] = '/images/branding/Discord-Symbol-Blurple.svg'
  linkedAccounts.push(discordData)
  let spotifyAccountData = {}
  spotifyAccountData['data'] = spotifyData;
  spotifyAccountData['branding_name'] = 'Spotify'
  spotifyAccountData['branding_avatar_path'] = '/images/branding/Spotify_Primary_Logo_RGB_Green.png'
  linkedAccounts.push(spotifyAccountData)

  return (
    <div>
      <TopBar userInfo={userData} userLoginMethods={userLoginMethods} isMember={memberStatus} avatarURL={avatarURL} linkedAccounts={linkedAccounts}/>
      {children}
    </div>
  );
}
