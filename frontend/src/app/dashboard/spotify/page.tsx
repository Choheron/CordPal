import PageTitle from "@/app/ui/dashboard/page_title";
import { Conditional } from "@/app/ui/dashboard/conditional";
import SpotifyLoginBox from "@/app/ui/dashboard/spotify/spotify_login_box";
import { getSpotifyData, isSpotifyLinked } from "@/app/lib/spotify_utils";
import TopSongsBox from "@/app/ui/dashboard/spotify/top_songs_list";

export default async function music() {
  const spot_authenticated = await isSpotifyLinked();
  const spotifyUserData = await getSpotifyData();

  return (
    <div className="flex min-h-screen flex-col items-center p-3 md:px-24 pt-10">
      <PageTitle text="Spotify" />
      <Conditional showWhen={!spot_authenticated}>
        <SpotifyLoginBox />
      </Conditional>
      <Conditional showWhen={spot_authenticated}>
        <div className="flex flex-col pb-36 lg:flex-row w-4/5 gap-5">
          <TopSongsBox 
            title={"Top Songs (4 Weeks)"}
            time_range={"short_term"}
            limit={"50"}
            offset={"0"}
          />
          <TopSongsBox 
            title={"Top Songs (6 Months)"}
            time_range={"medium_term"}
            limit={"50"}
            offset={"0"}
          />
          <TopSongsBox 
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