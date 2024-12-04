'use server'

import PageTitle from "@/app/ui/dashboard/page_title";
import { Conditional } from "@/app/ui/dashboard/conditional";
import SpotifyLoginBox from "@/app/ui/dashboard/spotify/spotify_login_box";
import { getLastXSubmissions, getSpotifyData, isSpotifyLinked } from "@/app/lib/spotify_utils";
import TopSongsList from "@/app/ui/dashboard/spotify/top_songs_list";
import AlbumOfTheDayBox from "@/app/ui/dashboard/spotify/album_of_the_day";
import AddAlbumModal from "@/app/ui/dashboard/spotify/add_album_modal";
import RecentSubmissions from "@/app/ui/dashboard/spotify/recent_submissions";
import MusicStatsBox from "@/app/ui/dashboard/spotify/music_stats_box";

export default async function music() {
  const spot_authenticated = await isSpotifyLinked();
  const recentSubmissionsResponse = await getLastXSubmissions(10);

  return (
    <div className="flex min-h-screen flex-col items-center p-3 pb-36 pt-10">
      <PageTitle text="Spotify" />
      <Conditional showWhen={!spot_authenticated}>
        <SpotifyLoginBox />
      </Conditional>
      <Conditional showWhen={spot_authenticated}>
        <AddAlbumModal />
        <div className="flex flex-col w-fit justify-center xl:flex-row md:w-4/5 gap-2">
          <AlbumOfTheDayBox title={"Album Of The Day"} />
          <RecentSubmissions 
            albumList={recentSubmissionsResponse['album_list']} 
            timestamp={recentSubmissionsResponse['timestamp']}
          />
          <MusicStatsBox />
        </div>
      </Conditional>
      <Conditional showWhen={spot_authenticated}>
        <div className="flex flex-col w-full lg:flex-row md:w-4/5 gap-5">
          <TopSongsList 
            previewVolume={0.5}
            title={"Top Songs (4 Weeks)"}
            time_range={"short_term"}
            limit={"50"}
            offset={"0"}
          />
          <TopSongsList 
            previewVolume={0.5}
            title={"Top Songs (6 Months)"}
            time_range={"medium_term"}
            limit={"50"}
            offset={"0"}
          />
          <TopSongsList 
            previewVolume={0.5}
            title={"Top Songs (1 Year)"}
            time_range={"long_term"}
            limit={"50"}
            offset={"0"}
          />
        </div>
      </Conditional>
    </div>
  );
}