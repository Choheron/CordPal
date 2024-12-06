"use server"

import { Divider } from "@nextui-org/react";

import AlbumDisplay from "./album_display";
import AlbumReviewBox from "./album_review_box";
import ReviewDisplay from "./review_display";
import { getAlbumOfTheDayData, getUserReviewForAlbum } from "@/app/lib/spotify_utils";

// GUI Display for the Album of the Day
// Expected Props:
//  - title: Title of the list
export default async function AlbumOfTheDayBox(props) {
  let albumOfTheDayObj = await getAlbumOfTheDayData()
  const albumReview = await getUserReviewForAlbum(albumData("album_id"))

  // Check if album of the day is outdated
  let todayDate = new Date()
  if(todayDate.toISOString().split('T')[0] != albumOfTheDayObj['AOD_date']) {
    albumOfTheDayObj = await getAlbumOfTheDayData()
  }

  // Pull data from album object, return empty string if not available
  function albumData(key) {
    if(key in albumOfTheDayObj) {
      return albumOfTheDayObj[key]
    } else { 
      return ''
    }
  }

  return (
    <div className="w-full lg:w-fit flex flex-col lg:flex-row backdrop-blur-2xl px-2 py-2 my-2 rounded-2xl bg-zinc-800/30 border border-neutral-800">
      <div className="w-full my-auto">
        <AlbumDisplay 
          title={albumData("title")}
          album_img_src={albumData("album_img_src")}
          album_src={albumData("album_src")}
          album_spotify_id={albumData("album_id")}
          artist={albumData("artist")}
          submitter={albumData("submitter")}
          submitter_comment={albumData("submitter_comment")}
          submission_date={albumData("submission_date")}
        />
        <AlbumReviewBox 
          album_id={albumData("album_id")}
          rating={(albumReview != null) ? albumReview['score'] : null}
          comment={(albumReview != null) ? albumReview['comment'] : null}
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