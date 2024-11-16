'use client'

import { Image } from "@nextui-org/react";
import {Badge} from "@nextui-org/badge";
import {Card, CardHeader, CardBody, CardFooter} from "@nextui-org/card";
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
    setLoading(true)
    getData()
  }, []);

  // Honestly I have NO CLUE what im looking at here but it seems to be working?? Not sure how I feel about it....
  useEffect(() => {
    const mapData = async () => {
      if (trackData['items']) {
        setMapSongList(
          trackData['items'].map((song_obj, index) => {
            // Extract data from massive JSON
            const album_img_src = song_obj['album']['images'][0]['url']
            const album_name = song_obj['album']['name']
            const album_link = song_obj['album']['external_urls']['spotify']
            const album_release_date = song_obj['album']['release_date']
            const artist_name = song_obj['artists'][0]['name']
            const artist_link = song_obj['artists'][0]['external_urls']['spotify']
            const song_name = song_obj['name']
            const song_link = song_obj['external_urls']['spotify']
            const song_preview_url = song_obj['preview_url']
            

            return (
              <Badge 
                key={index + 1}
                content={(index + 1) + "."} 
                size="lg" 
                color="primary" 
                placement="top-left" 
                shape="rectangle"
                showOutline={false}
                variant="solid"
                className="-ml-4"
              >
                <Card 
                  className="h-40 2xl:h-28 w-full max-w-[640px]"
                >
                  <CardHeader className="absolute my-auto z-10 top-1 flex !items-start">
                    <Avatar 
                      src={album_img_src}
                      className="w-20 h-20 min-w-20 max-w-20 text-large"
                    />
                    <div className="flex flex-col ml-4 w-full">
                      <h4 className="font-bold text-large line-clamp-1">{song_name}</h4>
                      <p className="text-tiny line-clamp-1">
                        <a href={artist_link} target="_noreferrer" className="w-fit hover:underline">
                          {artist_name}
                        </a>
                        {" - "}
                        <a href={album_link} target="_noreferrer" className="w-fit hover:underline">
                          {album_name}
                        </a>
                      </p>
                      <div className="flex flex-col 2xl:flex-row w-full justify-between">
                        <div className="flex flex-col w-fit text-nowrap">
                          <small className="text-default-500"><a href={song_link} target="_noreferrer" className="underline hover:text-purple-400 w-fit text-sm">Spotify</a></small>
                          <small className="text-default-500">{album_release_date}</small>
                        </div>
                        <audio controls className="pt-2 pb-2 pl-2 w-64 lg:w-full">
                          <source src={song_preview_url} type="audio/mpeg"/>
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    </div>
                  </CardHeader>
                  <Image
                    removeWrapper
                    alt="Album cover"
                    className="z-0 w-full h-full object-none object-center blur-md brightness-50"
                    src={album_img_src}
                  />
                </Card>
              </Badge>
            );
          })
        )
      }
    }
    mapData()
  }, [trackData]);

  // Honestly I have NO CLUE what im looking at here but it seems to be working?? Not sure how I feel about it....
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