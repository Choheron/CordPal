import PageTitle from "@/app/ui/dashboard/page_title";
import { Conditional } from "@/app/ui/dashboard/conditional";
import SpotifyLoginBox from "@/app/ui/dashboard/spotify/spotify_login_box";
import { getSpotifyData, isSpotifyLinked } from "@/app/lib/spotify_utils";

export default async function music() {
  const spot_authenticated = await isSpotifyLinked();
  const spotifyUserData = await getSpotifyData();

  return (
    <div className="flex min-h-screen flex-col items-center p-24 pt-10">
      <PageTitle text="Spotify" />
      <Conditional showWhen={!spot_authenticated}>
        <SpotifyLoginBox />
      </Conditional>
      <Conditional showWhen={spot_authenticated}>
        <p>You have authenticated with spotify!</p>
      </Conditional>
    </div>
  );
}