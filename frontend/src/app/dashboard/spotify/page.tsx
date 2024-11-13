import PageTitle from "@/app/ui/dashboard/page_title";
import { Conditional } from "@/app/ui/dashboard/conditional";
import SpotifyLoginBox from "@/app/ui/dashboard/spotify/spotify_login_box";
import { getSpotifyData, getSpotifyTopItems, isSpotifyLinked } from "@/app/lib/spotify_utils";
import TopSongsBox from "@/app/ui/dashboard/spotify/top_songs_list";

export default async function music() {
  const spot_authenticated = await isSpotifyLinked();
  const spotifyUserData = await getSpotifyData();
  // Collect data on tracks for all three timeframes
  const shortTerm = await getSpotifyTopItems("tracks", "short_term", "50", 0)
  const mediumTerm = await getSpotifyTopItems("tracks", "medium_term", "50", 0)
  const longTerm = await getSpotifyTopItems("tracks", "long_term", "50", 0)

  return (
    <div className="flex min-h-screen flex-col items-center p-3 md:p-24 pt-10">
      <PageTitle text="Spotify" />
      <Conditional showWhen={!spot_authenticated}>
        <SpotifyLoginBox />
      </Conditional>
      <Conditional showWhen={spot_authenticated}>
        <div className="flex flex-col pb-36 sm:flex-row w-4/5 gap-5">
          <TopSongsBox 
            title={"Top Songs (4 Weeks)"}
            trackData={shortTerm}
          />
          <TopSongsBox 
            title={"Top Songs (6 Months)"}
            trackData={mediumTerm}
          />
          <TopSongsBox 
            title={"Top Songs (1 Year)"}
            trackData={longTerm}
          />
        </div>
      </Conditional>
    </div>
  );
}