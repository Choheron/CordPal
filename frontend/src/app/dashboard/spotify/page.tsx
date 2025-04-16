'use server'

import PageTitle from "@/app/ui/dashboard/page_title";
import { Conditional } from "@/app/ui/dashboard/conditional";
import SpotifyLoginBox from "@/app/ui/dashboard/spotify/spotify_login_box";
import { getAllAlbums, getLastXSubmissions, getSpotifyData, isSpotifyLinked } from "@/app/lib/spotify_utils";
import AlbumOfTheDayBox from "@/app/ui/dashboard/spotify/album_of_the_day";
import RecentSubmissions from "@/app/ui/dashboard/spotify/recent_submissions";
import MusicStatsBox from "@/app/ui/dashboard/spotify/statistics_displays/music_stats_box";
import AllAlbumsModal from "@/app/ui/dashboard/spotify/modals/all_albums_modal";
import AllTopSongsBox from "@/app/ui/dashboard/spotify/all_top_songs_box";

export default async function music() {
  const spot_authenticated = await isSpotifyLinked();
  const recentSubmissionsResponse = await getLastXSubmissions(10);
  // Fetch all albums on the serverside to reduce loading time of modal
  // const allAlbumsList = await getAllAlbums()

  return (
    <div className="flex flex-col items-center p-3 pb-36 pt-10">
      <PageTitle text="Album Of The Day" />
      <Conditional showWhen={!spot_authenticated}>
        <SpotifyLoginBox />
      </Conditional>
      <Conditional showWhen={spot_authenticated}>
        <div className="flex flex-col w-fit justify-center xl:flex-row md:w-4/5 gap-2">
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
      <Conditional showWhen={spot_authenticated}>
        <AllTopSongsBox />
      </Conditional>
    </div>
  );
}