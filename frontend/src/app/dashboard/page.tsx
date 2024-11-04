"use server"

import { Conditional } from "../ui/dashboard/conditional";
import { isMember, getDiscordUserData } from "../lib/discord_utils";
import { getUserData } from "../lib/user_utils";
import { boolToString } from "../lib/utils";
import PageTitle from "../ui/dashboard/page_title";

export default async function Page() {
  const discordUserData = await getDiscordUserData();
  const userData = await getUserData();
  const memberStatus = await isMember();
  
  return (
    <main className="flex min-h-screen flex-col items-center p-24 pt-10">
      <PageTitle text="Homepage" />
      <div className="flex flex-col w-full lg:w-10/12 lg:justify-around lg:flex-row" >
        <div className="flex flex-col items-center mx-auto">
          <p>Here is your discord user data:</p>
          <p className="b pt-10 pb-6 backdrop-blur-2xl border-neutral-800 bg-zinc-800/30 from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:bg-zinc-800/30">
            ID: {discordUserData['id']}<br/>
            Username: {discordUserData['username']}<br/>
            Avatar Hash: {discordUserData['avatar']}<br/>
            Discriminator: {discordUserData['discriminator']}<br/>
            Public Flags: {discordUserData['public_flags']}<br/>
            Flags: {discordUserData['flags']}<br/>
            Accent Color: {discordUserData['accent_color']}<br/>
            Global Name: {discordUserData['global_name']}<br/>
            Banner Color: {discordUserData['banner_color']}<br/>
            Discord Verified: {boolToString(discordUserData['verified'])}<br/>
            MFA Enabled: {boolToString(discordUserData['mfa_enabled'])}<br/>
            Locale: {discordUserData['locale']}<br/>
            Premium Type: {discordUserData['premium_type']}<br/>
            <br/>
            EMAIL: {discordUserData['email']}<br/>
            <br/>
            Click <a href="https://discord.com/developers/docs/resources/user" target="_blank" className="underline italic"><b>here</b></a> for more info on what all of this means!
          </p>
        </div>
        <div className="flex flex-col items-center mx-auto">
          <p>Here is the data this site has stored in the DB:</p>
          <p className="b pt-10 pb-6 backdrop-blur-2xl border-neutral-800 bg-zinc-800/30 from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:bg-zinc-800/30">
            Discord ID: {userData['discord_id']}<br/>
            Username: {userData['username']}<br/>
            Nickname: {userData['nickname']}<br/>
            Avatar Hash: {userData['discord_avatar']}<br/>
            Discriminator: {userData['discord_discriminator']}<br/>
            Discord Verified: {boolToString(userData['discord_is_verified'])}<br/>
            Email: {userData['email']}<br/>
            <br/>
            Last Updated Timestamp: {userData['last_updated_timestamp']}<br/>
            Creation Timestamp: {userData['creation_timestamp']}<br/>
            Is Active: {boolToString(userData['is_active'])}<br/>
            Is Staff: {boolToString(userData['is_staff'])}<br/>
          </p>
        </div>
      </div>
      <Conditional showWhen={!(memberStatus)}>
        <br/>
        <p className="b pt-10 pb-6 backdrop-blur-2xl border-red-800 bg-zinc-800/30 from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:bg-zinc-800/30">
          <div className="flex w-full justify-center">
            <svg className="h-56 w-56 text-red-600"  fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016zM12 9v2m0 4h.01"/>
            </svg>
          </div>
          You, {discordUserData['global_name']}, are not a member of the server this website is for! How did you end up here?
        </p>
      </Conditional>
    </main>
  );
}