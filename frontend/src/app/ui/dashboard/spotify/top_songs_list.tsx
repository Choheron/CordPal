'use client'

import dynamic from "next/dynamic";

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
//  - previewVolume: Volume of the preview sound
export default function TopSongsList(props) {
  const [loading, setLoading] = useState(true)
  const [trackData, setTrackData] = useState({})
  const [mapSongList, setMapSongList] = useState([])

  useEffect(() => {
    const getData = async () => {
      setTrackData(await getSpotifyTopItems("tracks", props.time_range, props.limit, props.offset))
    }
    setLoading(true)
    getData()
  }, []);

  // Implement some kind of lazy loading??
  const LazySongCard = dynamic(() => import('./song_card'), {
    loading: () => <Spinner />
  });

  useEffect(() => {
    const mapData = async () => {
      if (trackData['items']) {
        setMapSongList(
          trackData['items'].map((song_obj, index) => {
            return <LazySongCard key={index} ranking={index+1} songObj={song_obj} previewVolume={props.previewVolume} />
          })
        )
      }
    }
    mapData()
  }, [trackData]);

  useEffect(() => {
    if(mapSongList.length == 0) {
      setLoading(true)
    } else {
      setLoading(false)
    }
  }, [mapSongList]);

  return (
    <div className="w-full">
      <p className="text-center">{props.title}:</p>
      <div className="flex flex-col mx-auto max-w-[650px] gap-4 backdrop-blur-2xl px-2 py-2 rounded-2xl bg-zinc-800/30 border border-neutral-800">
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