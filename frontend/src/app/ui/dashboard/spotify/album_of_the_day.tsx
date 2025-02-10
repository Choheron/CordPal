"use server"

import { Button, Divider } from "@nextui-org/react";

import AlbumDisplay from "./album_display";
import AlbumReviewBox from "./album_review_box";
import ReviewDisplay from "./review_display";
import { getAlbumOfTheDayData, getChanceOfAotdSelect, getSimilarReviewsForRatings, getUserReviewForAlbum } from "@/app/lib/spotify_utils";
import AddAlbumModal from "./modals/add_album_modal";
import Link from "next/link";

// GUI Display for the Album of the Day
// Expected Props:
//  - title: Title of the list
export default async function AlbumOfTheDayBox(props) {
  let albumOfTheDayObj = await getAlbumOfTheDayData()
  const albumReview = await getUserReviewForAlbum(albumData("album_id"))
  const similarReviewData = await getSimilarReviewsForRatings()
  const userSelectChance = await getChanceOfAotdSelect()

  // Check if album of the day is outdated
  let todayDate = new Date()
  if(todayDate.toISOString().split('T')[0] != albumOfTheDayObj['AOD_date']) {
    albumOfTheDayObj = await getAlbumOfTheDayData()
  }

  // Get yesterday's date
  const yesterdayString = new Date(new Date().setDate(new Date().getDate()-1)).toISOString().split('T')[0];

  // Pull data from album object, return empty string if not available
  function albumData(key) {
    if(key in albumOfTheDayObj) {
      return albumOfTheDayObj[key]
    } else { 
      return ''
    }
  }

  return (
    <div className="w-full lg:max-w-[1080px] flex flex-col lg:flex-row backdrop-blur-2xl px-2 py-2 my-2 rounded-2xl bg-zinc-800/30 border border-neutral-800">
      <div className="w-full flex flex-col">
        <div className="ml-2 mt-1 mb-1">
          <Button 
            as={Link}
            href={"/dashboard/spotify/historical/" + yesterdayString}
            radius="lg"
            className={`w-fit hover:underline text-white bg-gradient-to-br from-green-700/80 to-green-800/80`}
            variant="solid"
          >
            <b>View Yesterday&apos;s Album</b>
          </Button> 
        </div>
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
          first_listen={(albumReview != null) ? albumReview['first_listen']: null}
          similar_review_data={similarReviewData}
        />
        <div className="w-full flex">
          <AddAlbumModal
            userSelectChance={userSelectChance.toFixed(2)}
          />
        </div>
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