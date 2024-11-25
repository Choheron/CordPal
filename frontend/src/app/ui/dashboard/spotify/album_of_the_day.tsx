"use server"

import { Divider } from "@nextui-org/react";

import AlbumDisplay from "./album_display";
import AlbumReviewBox from "./album_review_box";
import ReviewDisplay from "./review_display";
import { getAlbumOfTheDayData, getReviewsForAlbum } from "@/app/lib/spotify_utils";

// GUI Display for the Album of the Day
// Expected Props:
//  - title: Title of the list
export default async function AlbumOfTheDayBox(props) {
  const albumOfTheDayObj = await getAlbumOfTheDayData()

  function albumData(key) {
    if(key in albumOfTheDayObj) {
      return albumOfTheDayObj[key]
    } else { 
      return ''
    }
  }

  return (
    <div className="w-full lg:w-fit flex flex-col lg:flex-row backdrop-blur-2xl px-2 mx-auto py-2 my-2 rounded-2xl bg-zinc-800/30 border border-neutral-800">
      <div className="w-full">
        <AlbumDisplay 
          title={albumData("title")}
          album_img_src={albumData("album_img_src")}
          album_src={albumData("album_src")}
          artist={albumData("artist")}
          submitter={albumData("submitter")}
          submitter_comment={albumData("submitter_comment")}
          submission_date={albumData("submission_date")}
          avg_rating={albumData("avg_rating")}
        />
        <AlbumReviewBox 
          album_id={albumData("album_id")}
        />
      </div>
      <Divider 
        className="mx-3" 
        orientation="vertical" 
      />
      <ReviewDisplay 
        album_id={albumData("album_id")}
      />
    </div>
  )
}