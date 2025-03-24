'use client'

import { useState, useEffect } from "react";
import { Conditional } from "../conditional";
import TopSongsList from "./top_songs_list";
import { Button } from "@heroui/react";


// Conditional display of all top songs items
// No expected props
export default function AllTopSongsBox(props) {
  const [showTopSongs, setShowTopSongs] = useState(false);

  // Set boolean to show top songs
  const handleButton = () => {
    setShowTopSongs(true);
  }

  return (
    <>
      <Conditional showWhen={!showTopSongs}>
        <Button 
          onPress={handleButton}
          className={"mt-2"}
        >
        Show Top Songs for Your Account
        </Button>
      </Conditional>
      <Conditional showWhen={showTopSongs}>
        <div className="flex flex-col w-full lg:flex-row md:w-4/5 gap-5">
          <TopSongsList 
            previewVolume={0.5}
            title={"Top Songs (4 Weeks)"}
            time_range={"short_term"}
            limit={"50"}
            offset={"0"}
          />
          <TopSongsList 
            previewVolume={0.5}
            title={"Top Songs (6 Months)"}
            time_range={"medium_term"}
            limit={"50"}
            offset={"0"}
          />
          <TopSongsList 
            previewVolume={0.5}
            title={"Top Songs (1 Year)"}
            time_range={"long_term"}
            limit={"50"}
            offset={"0"}
          />
        </div>
      </Conditional>
    </>
  )
}