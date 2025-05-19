'use server'

import { RiArrowRightWideFill } from "react-icons/ri"

// GUI Display for a Single Playlist
// Expected Props:
//  - playlistItem: Object - A single instance of a playlist item from the spotify web api: https://developer.spotify.com/documentation/web-api/reference/get-list-users-playlists 
export default async function PlaylistDisplay(props) {
  const playlistJSON = props.playlistItem
  // Extract data from JSON
  const title = playlistJSON['name']
  const imgSrc = playlistJSON['images'][0]['url']
  const ownerData = playlistJSON['owner']
  const spotifyUrl = playlistJSON['external_urls']['spotify']
  const isCollaborative = playlistJSON['collaborative']
  const isPublic = playlistJSON['public']
  const totalTracks = playlistJSON['tracks']['total']
  const playlistID = playlistJSON['id']

  return (
    <a 
      className="relative group flex w-full text-left max-w-[600px] rounded-2xl p-2 bg-gradient-to-r from-gray-600/30 to-gray-500/30 hover:to-gray-600 transition-all duration-150 ease-in-out"
      href={`/dashboard/grooveselect/${playlistID}`}
    >
      <div className="size-[150px] mr-3 flex-shrink-0">
        <img 
          title={`Playlsit Cover for ${title} by ${ownerData['display_name']}`}
          src={imgSrc}
          className='rounded-2xl w-full h-full'
          alt={`Playlsit Cover for ${title} by ${ownerData['display_name']}`}
        />
      </div>
      <div>
        <p className="text-3xl group-hover:underline line-clamp-1 font-medium">{title}</p>
        <p>{(isCollaborative) ? "Collaborative" : "Personal"}</p>
        <p>{(isPublic) ? "Public" : "Private"}</p>
        <p>{totalTracks} Tracks</p>
      </div>
      <div
        className="absolute top-0 right-2 h-full flex flex-col justify-center"
      >
        <RiArrowRightWideFill className="text-3xl h-fit"/>
      </div>
    </a>
  )
}