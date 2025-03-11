"use server"

import { Conditional } from "../ui/dashboard/conditional";
import { isMember, getDiscordUserData } from "../lib/discord_utils";
import { getAllOnlineData, getUserData, getUserList } from "../lib/user_utils";
import PageTitle from "../ui/dashboard/page_title";
import LiveOnlineUsersBox from "../ui/dashboard/live_online_users_box";
import CurrentTime from "../ui/general/current_time";
import AlbumDisplay from "../ui/dashboard/spotify/album_display";
import { getAlbumOfTheDayData } from "../lib/spotify_utils";

export default async function Page() {
  const discordUserData = await getDiscordUserData();
  const userData = await getUserData();
  const memberStatus = await isMember();
  // Inital props for passing to client list
  const userList = await getUserList();
  const onlineData = await getAllOnlineData();
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
    <main className="flex min-h-screen flex-col items-center lg:p-24 pt-10 lg:pt-10">
      <PageTitle text="Homepage" />
      <div className="flex flex-col w-full lg:justify-center gap-3 lg:w-10/12 lg:flex-row" >
        <div className="flex flex-col w-fit">
          <CurrentTime />
        </div>
        <div className="flex flex-col h-fit w-full max-w-[800px] px-2 py-2 lg:p-4 items-center border-neutral-800 bg-zinc-800/30 from-inherit rounded-xl border">
          <p className="text-2xl pb-2 underline font-extralight">
            Today&apos;s Album of the Day:
          </p>
          <AlbumDisplay 
            title={albumData("title")}
            album_img_src={albumData("album_img_src")}
            album_src={albumData("album_src")}
            album_spotify_id={albumData("album_id")}
            artist={albumData("artist")}
            submitter={albumData("submitter")}
            submitter_comment={albumData("submitter_comment")}
            submission_date={albumData("submission_date")}
            member_status={memberStatus}
          />
        </div>
        <Conditional showWhen={(memberStatus)}>
          <LiveOnlineUsersBox 
            pollingInterval={10}
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