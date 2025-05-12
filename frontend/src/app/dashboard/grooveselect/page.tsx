import { getSpotifyBearerToken } from "@/app/lib/spotify_utils";
import PageTitle from "@/app/ui/dashboard/page_title";

export default async function GrooveSelect(props) {
  // Retrieve data from backend (Get spotify bearer token. NOTE: This will not be a thing in the real grooveselect)
  const bearer_token = await getSpotifyBearerToken()
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


  return (
    <main className="flex flex-col items-center lg:px-24 pt-10">
      <PageTitle text="[WIP] GrooveSelect [WIP]" />
      <p>You have {playlistResJSON['total']} playlists: </p>
      {playlistResJSON['items'].map((item, index) => {
        return (
          <div className="flex mx-auto w-full sm:w-fit my-2">
            <div className="size-[150px] mr-3">
              <img 
                title={`Playlsit Cover for ${item['name']} by ${item['owner']['display_name']}`}
                src={item['images'][0]['url']}
                className='rounded-2xl mx-auto object-cover'
                alt={`Playlsit Cover for ${item['name']} by ${item['owner']['display_name']}`}
              />
            </div>
            <div>
              <a href={item['external_urls']['spotify']} className="text-2xl hover:underline">{item['name']}</a>
              <p>Owner: {item['owner']['display_name']}</p>
              <p>{(item['collaborative']) ? "Collaborative" : "Personal"}</p>
              <p>{(item['public']) ? "Public" : "Private"}</p>
              <p>{item['tracks']['total']} songs</p>
            </div>
          </div>
        )
      })}
    </main>
  );
}
