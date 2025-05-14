"use client"

import { Button, Card, CardBody, CardHeader, Progress, Skeleton } from "@heroui/react"
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
  const [currTrack, setCurrTrack] = useState(trackList[0])


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
    // Set Current Track
    setCurrTrack(trackList[currSongIndex])
    
  }, [currSongIndex])

  // Get skeletons for current index
  const getSkeletons = () => {
    let skeletons: any = []
    for(let i = currSongIndex - 2; i < 0; i++) {
      skeletons.push(<Skeleton key={i} className="w-1/5 p-1 border border-gray-600 rounded-lg m-2"/>)
    }
    return skeletons
  }

  // Handle Selection Button
  const handleButton = (action: string) => {
    trackList[currSongIndex]['USER_CHOICE'] = action
    setTrackList(trackList)
    setCurrSongIndex(currSongIndex + 1)
  }

  console.log(currTrack)
  return (
    <div>
      {/* Top Display of current song and progress */}
      <div className="w-full lg:w-3/4 mx-auto px-5 md:px-0 mt-2">
        <Progress 
          aria-label="Progress through playlist..."
          className="w-full pb-3"
          color="success"
          label={`Playlist Progress: ${currSongIndex + 1} out of ${trackData['total']}`}
          maxValue={trackData['total']}
          showValueLabel={true}
          size="md"
          value={currSongIndex + 1}
        />
        <div className={`border rounded-2xl flex w-full ${(currSongIndex < 2) ? "justify-end" : ""}`}>
          {
            (currSongIndex - 2 < 0) ? (
              getSkeletons()
            ):(
              <></>
            )
          }
          {
            trackList.slice(Math.max(currSongIndex-2, 0), Math.min(currSongIndex+3, (trackList.length))).map((track, index) => {
              let trackData = track['track']
              let albumData = trackData['album']
              let artistData = trackData['artists'][0]
              let isCurrent = (trackData['name'] == trackList[currSongIndex]['track']['name'])

              return (
                <div 
                  className={`flex w-1/5 p-1 border border-gray-600 rounded-lg m-2 ${(isCurrent) ? "bg-yellow-300/40" : ""} ${(track['USER_CHOICE']) ? ((track['USER_CHOICE'] == "KEEP") ? "bg-green-400/30" : "bg-red-400/30") : ""}`}
                  key={index}
                >
                  <div className={`size-[50px] sm:mr-1 flex-shrink-0`}>
                    <img 
                      src={albumData['images'][0]['url']}
                      className='rounded-lg w-full h-full'
                      alt={`test`}
                    />
                  </div>
                  <div className="hidden sm:block">
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
      <div className="flex justify-center">
        {/* Remove Button */}
        <Button 
          onPress={() => handleButton("REMOVE")}
          isDisabled={currTrack == null}
          className="text-black mr-2 my-auto"
          color="danger"
        >
          <b>Remove</b>
        </Button>
        {/* Song Card */}
        <Card
          className="w-2/5 md:w-[600px]"
        >
          <CardHeader className="w-full max-h-full p-0">
            <img 
              src={currTrack['track']['album']['images'][0]['url']}
              className='rounded-lg w-full h-full'
              alt={`test`}
            />
          </CardHeader>
          <CardBody>
            <a href={currTrack['track']['external_urls']['spotify']} className="text-sm sm:text-3xl line-clamp-1 hover:underline">{currTrack['track']['name']}</a>
            <a href={currTrack['track']['artists'][0]['external_urls']['spotify']} className="text-xs sm:text-xl italic hover:underline">{currTrack['track']['artists'][0]['name']}</a>
            <a href={currTrack['track']['album']['external_urls']['spotify']} className="text-xs sm:text-lg hover:underline">{currTrack['track']['album']['name']}</a>
            <p className="text-xs sm:text-base">Length: {(currTrack['track']['duration_ms']/1000/60).toFixed(0)}:{(currTrack['track']['duration_ms']/1000%60).toFixed(0).padStart(2, "0")}</p>
            <p className="text-xs sm:text-base">Released: {currTrack['track']['album']['release_date']}</p>
            <p className="text-xs sm:text-base">Added: {currTrack['added_at'].substring(0, 10)}</p>
          </CardBody>
        </Card>
        {/* Keep Button */}
        <Button 
          onPress={() => handleButton("KEEP")}
          isDisabled={currTrack == null}
          className="ml-2 my-auto"
          color="success"
        >
          <b>Keep</b>
        </Button>
      </div>
    </div>
  )
}