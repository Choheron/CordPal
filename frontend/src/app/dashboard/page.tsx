"use server"

import { Conditional } from "../ui/dashboard/conditional";
import { isMember, getDiscordUserData } from "../lib/discord_utils";
import { getAllOnlineData, getUserData, getUserList, getUsersByTimezone } from "../lib/user_utils";
import PageTitle from "../ui/dashboard/page_title";
import LiveOnlineUsersBox from "../ui/dashboard/live_online_users_box";
import AlbumDisplay from "../ui/dashboard/aotd/album_display";
import { getAlbumOfTheDayData } from "../lib/aotd_utils";
import AllTimezonesBlock from "../ui/dashboard/allTimezonesBlock";
import UserActionsBlock from "../ui/dashboard/userActionsBlock";

export default async function Page() {
  const discordUserData = await getDiscordUserData();
  const userData = await getUserData();
  const memberStatus = await isMember();
  // Inital props for passing to client list
  const userList = await getUserList();
  const onlineData = await getAllOnlineData();
  // Get inital props for clocks
  const timezoneData = await getUsersByTimezone();
  // Get Album of the day data
  let albumOfTheDayObj = await getAlbumOfTheDayData()

  // Pull data from album object, return empty string if not available
  function albumData(key) {
    if(key in albumOfTheDayObj) {
      return albumOfTheDayObj[key]
    } else { 
      return ''
    }
  }

  
  return (
    <main className="flex flex-col max-w-full items-center lg:p-24 pt-10 lg:pt-10">
      <PageTitle text="Homepage" />
      <div className="flex flex-col w-full lg:justify-center gap-3 lg:w-10/12 lg:flex-row" >
        <AllTimezonesBlock timezoneData={timezoneData} />
        <div className="flex flex-col gap-2 max-h-[800px]">
          <div className="relative flex flex-col h-fit w-full max-w-full sm:max-w-[800px] px-2 py-2 lg:p-4 items-center border-neutral-800 bg-zinc-800/30 from-inherit rounded-xl border">
            <p className="absolute top-0 left-0 p-1 text-2xl font-extralight bg-gray-900 rounded-tl-xl rounded-br-xl">
              Today&apos;s Album of the Day
            </p>
            <div className="h-8">
              {/* Spacer for Title */}
            </div>
            <AlbumDisplay 
              title={albumData("title")}
              album_img_src={albumData("album_img_src")}
              album_src={albumData("album_src")}
              album_mbid={albumData("album_id")}
              artist={albumData("artist")}
              submitter={albumData("submitter")}
              submitter_comment={albumData("submitter_comment")}
              submission_date={albumData("submission_date")}
              release_date={albumData("release_date")}
              release_date_precision={albumData("release_date_precision")}
              member_status={memberStatus}
            />
          </div>
          <div className="relative flex flex-col h-fit w-full max-w-full sm:max-w-[800px] px-2 py-2 lg:p-4 items-center border-neutral-800 bg-zinc-800/30 from-inherit rounded-xl border">
            <p className="absolute top-0 left-0 p-1 text-2xl font-extralight bg-gray-900 rounded-tl-xl rounded-br-xl">
              Recent User Actions
            </p>
            <div className="h-8">
              {/* Spacer for Title */}
            </div>
            <UserActionsBlock />
          </div>
        </div>
        <Conditional showWhen={(memberStatus)}>
          <LiveOnlineUsersBox 
            pollingInterval={15}
            userList={userList}
            onlineData={onlineData}
          />
        </Conditional>
      </div>
      <Conditional showWhen={!(memberStatus)}>
        <br/>
        <p className="max-w-3/4 b pt-10 pb-6 backdrop-blur-2xl border-red-800 bg-zinc-800/30 from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:bg-zinc-800/30">
          Welcome, {discordUserData['global_name']}! Please note that since you are either 1. Not a member of the discord server this website is for, or 2. You are a member but do
          not have the required roles in the server, you are not able to view most data on this website. Thats okay! You can still poke around and see whats up as you like. If you
          are a member of the server and believe this to be some kind of mistake, please contact the admins on the server.
        </p>
      </Conditional>
    </main>
  );
}