'use client'

import {Avatar} from "@nextui-org/react";
import { useState, useEffect } from "react";
import { getSpotifyTopItems } from "@/app/lib/spotify_utils";
import { Conditional } from "../conditional";
import {Spinner} from "@nextui-org/spinner";


// Gui Column mapping passed in song data and displaying the passed in title
// Expected Props:
//  - title: Title of the list
//  - time_range: How far back to get in the api (short_term, medium_term, and long_term)
//  - limit: Limit to retrieve (Range 0-50)
//  - offset: Page to retrieve (most of the time this will be 0 until over 50 results is implemented)
export default function TopSongsBox(props) {
  const [loading, setLoading] = useState(true)
  const [trackData, setTrackData] = useState({})
  const [mapSongList, setMapSongList] = useState([])

  useEffect(() => {
    const getData = async () => {
      setTrackData(await getSpotifyTopItems("tracks", props.time_range, props.limit, props.offset))
    }
    getData()
  }, []);

  useEffect(() => {
    const mapData = async () => {
      if (trackData['items']) {
        setMapSongList(
          trackData['items'].map((song_obj, index) => {
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
              <div className="flex" key={index + 1}>
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
          })
        )
      }
    }
    mapData()
    console.log(trackData)
    setLoading(false)
  }, [trackData]);

  return (
    <div className="w-full">
      <p className="text-center">{props.title}:</p>
      <div className="flex flex-col gap-6 backdrop-blur-2xl px-2 py-2 rounded-2xl bg-zinc-800/30 border border-neutral-800">
      <Conditional showWhen={loading}>
        <Spinner size="lg" />
      </Conditional>
      <Conditional showWhen={!loading}>
        {mapSongList}
      </Conditional>
      </div>
    </div>
  )
}