import {Avatar} from "@nextui-org/react";

// Gui Column mapping passed in song data and displaying the passed in title
// Expected Props:
//  - title: Title of the list
//  - trackData: List of objects to be shown
export default function TopSongsBox(props) {
  const mapSongList = props.trackData['items'].map((song_obj, index) => {
    // Extract data from massive JSON
    const album_img_src = song_obj['album']['images'][0]['url']
    const album_name = song_obj['album']['name']
    const album_release_date = song_obj['album']['release_date']
    const artist_name = song_obj['artists'][0]['name']
    const artist_link = song_obj['artists'][0]['external_urls']['spotify']
    const song_name = song_obj['name']
    const song_link = song_obj['external_urls']['spotify']

    // Return Data
    return (
      <div className="flex">
        <h1 className="text-lg my-auto mr-2">{index + 1}.</h1>
        <div className="flex flex-row w-full">
          <Avatar src={album_img_src} className="w-16 h-16 text-large" />
          <div className="flex flex-col ml-4">
            <p className="w-full line-clamp-1"><b>{song_name}</b></p>
            <p className="w-full line-clamp-1 text-sm">
              <a href={artist_link} target="_noreferrer" className="w-fit hover:text-purple-400">
                {artist_name}
              </a>
             - {album_name}
            </p>
            <a href={song_link} target="_noreferrer" className="underline hover:text-purple-400 w-fit text-sm">Listen</a>
          </div>
        </div>
      </div>
    );
  });

  return (
    <div className="w-full">
      <p className="text-center">{props.title}:</p>
      <div className="flex flex-col gap-6 backdrop-blur-2xl px-2 py-2 rounded-2xl bg-zinc-800/30 border border-neutral-800">
        {mapSongList}
      </div>
    </div>
  )
}