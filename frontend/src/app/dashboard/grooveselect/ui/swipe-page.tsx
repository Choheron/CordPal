"use client"

import { Button, Progress } from "@heroui/react"
import { useEffect, useState } from "react"

// Swipe interaction page for a single playlist, will be the bulk of the program
// Expected Props:
//  - playlistObj: Object - Response JSON from web api (https://developer.spotify.com/documentation/web-api/reference/get-playlist)
//  - userData: Object - Response JSON from web api (https://developer.spotify.com/documentation/web-api/reference/get-current-users-profile)
//  - bearerToken: String - User's bearer token for Spotify
export default function SwipePage(props) {
  const playlistData = props.playlistObj
  const trackData = playlistData['tracks']
  const [nextTrackPageUrl, setNextTrackPageUrl] = useState(trackData['next'])
  const [trackList, setTrackList] = useState<Object[]>(trackData['items'])
  const userData = props.userData
  const bearer_token = props.bearerToken
  // Control over queries
  const [pollingBackend, setPollingBackend] = useState(false)
  // Current song index
  const [currSongIndex, setCurrSongIndex] = useState(0)


  // UseEffect on current song index
  useEffect(() => {
    const queryNextTracks = async () => {
      const playlistResJSON = (await (await fetch('/dashboard/grooveselect/api/get-playlist-tracks', {
        method: "GET",
        credentials: "include",
        cache: 'no-cache',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${bearer_token}`,
          'queryurl': nextTrackPageUrl,
        },  
      })).json())['data'];
      // Extend tracklist
      setTrackList(trackList.concat(playlistResJSON['items']))
      setNextTrackPageUrl(playlistResJSON['next'])
      setPollingBackend(false)
      console.log(trackList)
      console.log(currSongIndex)
    }

    // If user is within 10 songs of the current length of tracks, and there are more tracks to be queried, extend the tracklist
    if(currSongIndex >= (trackList.length - 10) && nextTrackPageUrl && !pollingBackend) {
      setPollingBackend(true)
      queryNextTracks()
    }
  }, [currSongIndex])


  return (
    <div>
      {/* Top Display of current song and progress */}
      <div className="w-full lg:w-3/4 mx-auto px-5 md:px-0 mt-5">
        <Progress 
          aria-label="Progress through playlist..."
          className="w-full pb-4"
          color="success"
          label={`Playlist Progress: ${currSongIndex + 1} out of ${trackData['total']}`}
          maxValue={trackData['total']}
          showValueLabel={true}
          size="md"
          value={currSongIndex + 1}
        />
        <div className={`border rounded-2xl flex w-full ${(currSongIndex < 2) ? "justify-end" : ""}`}>
          {
            trackList.slice(Math.max(currSongIndex-2, 0), Math.min(currSongIndex+3, (trackList.length-1))).map((track, index) => {
              let trackData = track['track']
              let albumData = trackData['album']
              let artistData = trackData['artists'][0]
              let isCurrent = (trackData['name'] == trackList[currSongIndex]['track']['name'])

              return (
                <div 
                  className={`flex w-1/5 p-1 border border-gray-600 rounded-lg m-2 ${(isCurrent) ? "bg-green-500/30" : ""}`}
                  key={index}
                >
                  <div className="size-[50px] mr-1 flex-shrink-0">
                    <img 
                      src={albumData['images'][0]['url']}
                      className='rounded-lg w-full h-full'
                      alt={`test`}
                    />
                  </div>
                  <div>
                    <p className="text-sm line-clamp-1">{trackData['name']}</p>
                    <p className="text-xs">{artistData['name']}</p>
                  </div>
                </div>
              )
            })
          }
        </div>
        <div className="flex justify-between px-1">
          <p>{`Tracks Sorted: ${currSongIndex}`}</p>
          <p>{`Tracks Remaining: ${(trackData['total']) - (currSongIndex+1)}`}</p>
        </div>
      </div>
      <Button 
        onPress={() => setCurrSongIndex(currSongIndex + 1)}
        isDisabled={currSongIndex == (trackList.length - 1)}
      >
        Increment Song
      </Button>
      <p>{trackList[currSongIndex]['track']['name']}</p>
    </div>
  )
}