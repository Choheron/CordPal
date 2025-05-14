"use client"

import { Button, Tooltip } from "@heroui/react";

import { 
  initPlayerPlayback 
} from "@/app/lib/spotify_utils";

import { RiPlayLargeFill} from "react-icons/ri";
import { Conditional } from "../conditional";

// GUI for a play button to initiate playing of an album
export default function AlbumPlayButton(props) {
  // Get user Data
  const spot_user_data = props.spotUserData
  // Get album data
  const albumOfTheDayObj = props.albumOfTheDayObj

  const handlePlayerButton = () => {
    // Get album URI
    const raw_album_data = JSON.parse(albumOfTheDayObj['raw_album_data'])
    const uri = raw_album_data['album']['uri']
    // Call playback handler
    initPlayerPlayback(uri)
  }

  return (
    <Conditional showWhen={spot_user_data['membership_type'] == "premium"}>
      <div className="w-fit">
        <Tooltip 
          content={"You must have an active Spotify session to play music."}
          className="max-w-40"
        >
          <Button
            radius="full"
            color="success"
            className="block w-fit min-w-fit h-fit p-2"
            onPress={handlePlayerButton}
          >
            <RiPlayLargeFill className="sm:text-2xl" />
          </Button>
        </Tooltip>
      </div>
    </Conditional>
  )
}

