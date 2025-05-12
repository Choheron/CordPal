import { getSpotifyBearerToken } from "@/app/lib/spotify_utils";
import PageTitle from "@/app/ui/dashboard/page_title";
import PlaylistDisplay from "./ui/playlist_button";

export default async function GrooveSelect(props) {
  // Retrieve data from backend (Get spotify bearer token. NOTE: This will not be a thing in the real grooveselect)
  const bearer_token = await getSpotifyBearerToken()
  // Get user profile data
  const userDataJSON = await (await fetch(`https://api.spotify.com/v1/me`, {
    method: "GET",
    credentials: "include",
    next: { revalidate: 300 },
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${bearer_token}`,
    },  
  })).json();
  // Get user playlists
  const playlistResJSON = await (await fetch(`https://api.spotify.com/v1/me/playlists?limit=50&offset=0`, {
    method: "GET",
    credentials: "include",
    next: { revalidate: 300 },
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${bearer_token}`,
    },  
  })).json();
  // Perform filters on playlist list
  const playlists: Object[] = playlistResJSON['items'].filter((item) => (item['owner']['id'] == userDataJSON['id'])).filter((item) => (item['tracks']['total'] != 0))


  return (
    <main className="flex flex-col items-center lg:px-24 pt-10">
      <PageTitle text="[WIP] GrooveSelect [WIP]" />
      <div className="flex">
        {/* Playlist Display and Selection */}
        <div>
          <p className="mx-auto w-fit text-3xl mb-2">Select one of your {playlists.length} owned playlists: </p>
          <div className="flex flex-col space-y-4 w-full sm:w-fit mx-auto">
            {playlists.map((item, index) => {
              return (
                <PlaylistDisplay playlistItem={item} key={index} />
              )
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
