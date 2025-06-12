'use server'

import PageTitle from "@/app/ui/dashboard/page_title";
import { Conditional } from "@/app/ui/dashboard/conditional";
import SpotifyLoginBox from "@/app/ui/dashboard/aotd/aotd_enroll_box";
import { getLastXSubmissions, isAotdParticipant } from "@/app/lib/aotd_utils";
import AlbumOfTheDayBox from "@/app/ui/dashboard/aotd/album_of_the_day";
import RecentSubmissions from "@/app/ui/dashboard/aotd/recent_submissions";
import MusicStatsBox from "@/app/ui/dashboard/aotd/statistics_displays/music_stats_box";
import AllAlbumsModal from "@/app/ui/dashboard/aotd/modals/all_albums_modal";
import { Alert } from "@heroui/react";

export default async function music() {
  const aotd_participant = await isAotdParticipant();
  const recentSubmissionsResponse = await getLastXSubmissions(8);
  // Fetch all albums on the serverside to reduce loading time of modal
  // const allAlbumsList = await getAllAlbums()

  return (
    <div className="flex flex-col items-center p-3 pb-36 pt-10">
      <PageTitle text="Album Of The Day" />
      <Conditional showWhen={!aotd_participant}>
        <SpotifyLoginBox />
      </Conditional>
      <Conditional showWhen={aotd_participant}>
        <div className="flex flex-col w-full lg:w-[650px] justify-center xl:flex-row md:w-4/5 gap-2">
          <AlbumOfTheDayBox title={"Album Of The Day"} />
          <div className="w-full max-w-full lg:max-w-[350px] flex flex-col">
            <RecentSubmissions 
              albumList={recentSubmissionsResponse['album_list']} 
              timestamp={recentSubmissionsResponse['timestamp']}
            />
            <AllAlbumsModal />
          </div>
        </div>
        <MusicStatsBox />
      </Conditional>
    </div>
  );
}