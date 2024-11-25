"use server"

import { Divider } from "@nextui-org/react";

import AlbumDisplay from "./album_display";
import AlbumReviewBox from "./album_review_box";
import ReviewDisplay from "./review_display";
import { getAlbumOfTheDayData } from "@/app/lib/spotify_utils";

// GUI Display for the Album of the Day
// Expected Props:
//  - title: Title of the list
export default async function AlbumOfTheDayBox(props) {
  const albumOfTheDayObj = await getAlbumOfTheDayData()

  const testReviews = [{user_id: "143849159747698689", score: 5.5, comment: "Super awesome album I loved it so much that rocked lets fucking gooo"}]

  return (
    <div className="w-full lg:w-fit flex flex-col lg:flex-row backdrop-blur-2xl px-2 mx-auto py-2 my-2 rounded-2xl bg-zinc-800/30 border border-neutral-800">
      <div className="w-full">
        <AlbumDisplay 
          title={albumOfTheDayObj.title}
          album_img_src={albumOfTheDayObj.album_img_src}
          album_src={albumOfTheDayObj.album_src}
          artist={albumOfTheDayObj.artist}
          submitter={albumOfTheDayObj.submitter}
          submitter_comment={albumOfTheDayObj.submitter_comment}
          submission_date={albumOfTheDayObj.submission_date}
          avg_rating={0.0}
        />
        <AlbumReviewBox />
      </div>
      <Divider 
        className="mx-3" 
        orientation="vertical" 
      />
      <ReviewDisplay reviews={testReviews}/>
    </div>
  )
}