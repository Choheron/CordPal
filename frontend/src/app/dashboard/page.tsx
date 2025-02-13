"use server"

import { Conditional } from "../ui/dashboard/conditional";
import { isMember, getDiscordUserData } from "../lib/discord_utils";
import { getUserData, getUserList } from "../lib/user_utils";
import { boolToString } from "../lib/utils";
import PageTitle from "../ui/dashboard/page_title";
import { Divider } from "@nextui-org/react";
import UserCard from "../ui/general/userUiItems/user_card";

export default async function Page() {
  const discordUserData = await getDiscordUserData();
  const userData = await getUserData();
  const memberStatus = await isMember();
  const userList: any = await getUserList();
  
  return (
    <main className="flex min-h-screen flex-col items-center p-24 pt-10">
      <PageTitle text="Homepage" />
      <div className="flex flex-col w-full lg:justify-center gap-3 lg:w-10/12 lg:flex-row" >
        <div className="flex flex-col w-full px-2 py-2 md:flex-row items-center border-neutral-800 bg-zinc-800/30 from-inherit lg:static lg:w-auto rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:bg-zinc-800/30">
          <div className="mx-2 mb-auto">
            <p>Here is your discord user data:</p>
            <p className="pt-10 pb-2">
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
          <Divider orientation="vertical" className="mx-3"/>
          <div className="mx-2 mb-auto">
            <p>Here is the data this site has stored in the DB:</p>
            <p className="pt-10 pb-2">
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
        <Conditional showWhen={(memberStatus)}>
          <div className="flex flex-row px-2 py-2 items-center border-neutral-800 bg-zinc-800/30 from-inherit lg:static lg:w-auto rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:bg-zinc-800/30">
            <div className="flex flex-col gap-1 h-full">
              <p className="mb-2">
                Other users that have validated:
              </p>
              { 
                userList.sort((a, b) => (a['last_request_timestamp'] < b['last_request_timestamp']) ? 1 : -1).map((userObj, index) => {
                  return (
                    <UserCard
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
        </Conditional>
      </div>
      <Conditional showWhen={!(memberStatus)}>
        <br/>
        <p className="b pt-10 pb-6 backdrop-blur-2xl border-red-800 bg-zinc-800/30 from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:bg-zinc-800/30">
          Welcome, {discordUserData['global_name']}! Please note that since you are either 1. Not a member of the discord server this website is for, or 2. You are a member but do
          not have the rquired roles in the server, you are not able to view most data on this website. Thats okay! You can still poke around and see whats up as you like. If you
          are a member of the server and believe this to be some kind of mistake, please contact the admins on the server.
        </p>
      </Conditional>
    </main>
  );
}