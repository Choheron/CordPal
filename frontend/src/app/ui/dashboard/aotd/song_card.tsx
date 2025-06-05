'use client'

import {Badge} from "@heroui/badge";
import {Card, CardHeader } from "@heroui/card";
import {Avatar, Button} from "@heroui/react";
import { Image } from "@heroui/react";

import { useRef, useEffect, useState } from "react";
import { Conditional } from "../conditional";

// Display a songcard from spotify
// Expected Props:
//   - ranking: int ranking of the song in the list
//   - songObj: The object containing the massive amount of song data
//   - previewVolume: The volume to set the preview to
export default function SongCard(props) {
  // Song Data
  const song_obj = props.songObj
  const ranking = props.ranking
  // Reference to the audio player
  const audioRef = useRef<HTMLAudioElement>(null); // Reference to the audio element
  const [audioSrc, setAudioSrc] = useState(null) // Initialize the source to null to avoid needless loading
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

  useEffect(() => {
    // Set Volume
    if(audioRef != null && audioRef.current != null) {
      audioRef.current.volume = props.previewVolume
    }
  }, [audioSrc]);

  return (
    <Badge 
      content={ranking + "."} 
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
              { /* Show Button if user has not loaded preview */ }
              { /*
              <Conditional showWhen={audioSrc == null}>
                <Button 
                  size="sm"
                  className="pt-2 pb-2 pl-2 my-auto"
                  onPress={() => {setAudioSrc(song_preview_url)}}
                >
                  Load Preview
                </Button>  
              </Conditional>
              */ }
              { /* Do not load audio source if the user has not clicked "load preview" */ }
              { /*
              { audioSrc && (
                <audio controls ref={audioRef} className="pt-2 pb-2 pl-2 w-64 lg:w-full">
                  <source src={audioSrc} type="audio/mpeg"/>
                  Your browser does not support the audio element.
                </audio>
              )}
                */ }
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
}