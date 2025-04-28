"use server"

import { ratingToTailwindBgColor } from "@/app/lib/utils";
import MinimalAlbumDisplay from "../../minimal_album_display";
import { Badge, Divider } from "@heroui/react";

// Display the highest and lowest album stats for a month, should only be called with the following props (to properly work)
// Expected Props:
//  - aotdStats: Obj - Object containing album of the day stats for that month
//  - reviewData: Obj - Object containing review data for that month
//  - year: String - Year of month
//  - month: String - Zero padded month number string
//  - monthName: String - Human readable month name
//  - highestAlbum: Obj - Object containing highest album of the month data
//  - lowestAlbum: Obj - Object containing lowest album of the month data
export default async function MonthlyLowestHighestAlbum(props) {
  // Retrieve props from parent component
  const aotdStats = (props.aotdStats) ? props.aotdStats : null;
  const reviewData = (props.reviewData) ? props.reviewData : null;
  const year = (props.year) ? props.year : null;
  const month = (props.month) ? props.month : null;
  const monthName = (props.monthName) ? props.monthName : null;
  // Highest and Lowest Album Objects
  const highestAlbumObj = (props.highestAlbum) ? props.highestAlbum : null;
  const lowestAlbumObj = (props.lowestAlbum) ? props.lowestAlbum : null;

  // Get data from props
  const highestAlbumDateArr = aotdStats['highest_aotd_date'].split("-")
  const lowestAlbumDateArr = aotdStats['lowest_aotd_date'].split("-")

  const highestAlbumRating = (highestAlbumObj['rating'] != null) ? highestAlbumObj['rating'].toFixed(2) : 0;
  const lowestAlbumRating = (lowestAlbumObj['rating'] != null) ? lowestAlbumObj['rating'].toFixed(2) : 0;

  // If No review data is in, return an empty box with a warning 
  if(reviewData['total_reviews'] == 0) {
    return (
      <div className="w-full lg:w-[400px] flex flex-col backdrop-blur-2xl pl-2 pr-4 py-2 my-2 rounded-2xl bg-zinc-800/30 border border-neutral-800">
        <div className="max-w-full mx-auto px-2 py-2 my-auto text-small text-center italic border border-neutral-800 rounded-2xl bg-zinc-800/30">
          <p>No review data for {monthName} {year}</p>
        </div>
      </div>
    )
  }
  // Otherwise do normal data display
  return (
    <div className="w-full lg:w-[400px] flex flex-col backdrop-blur-2xl pl-2 pr-4 py-2 my-2 rounded-2xl bg-zinc-800/30 border border-neutral-800">
      {/* Highest Album */}
      <p className="font-extralight w-full text-center text-xl">
        {monthName} {year}&lsquo;s Highest:
      </p>
      <Divider className="mb-1" />
      <div className="relative w-full h-full p-1">
        <div className="h-fit lg:text-xl flex mx-auto w-full justify-between px-0 sm:px-2 mb-1">
          <p>{monthName} {highestAlbumDateArr[2]}</p>
          <p className={`${ratingToTailwindBgColor(highestAlbumRating)} text-black w-fit px-1 rounded-2xl`}>
            {highestAlbumRating}
          </p>
        </div>
        <div>
          <MinimalAlbumDisplay
            showSubmitInfo
            showAlbumRating={true}
            ratingOverride={highestAlbumObj["rating"]}
            title={highestAlbumObj["title"]}
            album_spotify_id={highestAlbumObj["spotify_id"]}
            album_img_src={highestAlbumObj["album_img_src"]}
            album_src={highestAlbumObj["spotify_url"]}
            artist={highestAlbumObj["artist"]}
            submitter={highestAlbumObj["submitter"]}
            submitter_comment={highestAlbumObj["submitter_comment"]}
            submission_date={highestAlbumObj["submission_date"]}
            historical_date={highestAlbumObj['date']}
            sizingOverride="w-full h-full"
            buttonUrlOverride={`/dashboard/spotify/calendar/${year}/${month}/${highestAlbumDateArr[2]}`}
            titleTextOverride="text-center text-xl 2xl:text-2xl text-wrap line-clamp-2"
            artistTextOverride="text-center text-sm 2xl:text-xl italic text-wrap"
            starTextOverride="text-base 2xl:text-3xl"
          />
        </div>
      </div>
      {/* Lowest Album */}
      <p className="font-extralight w-full text-center text-xl">
        {monthName} {year}&lsquo;s Lowest:
      </p>
      <Divider className="mb-1" />
      <div className="relative w-full h-full p-1">
        <div className="h-fit lg:text-xl flex mx-auto w-full justify-between px-0 sm:px-2 mb-1">
          <p>{monthName} {lowestAlbumDateArr[2]}</p>
          <p className={`${ratingToTailwindBgColor(lowestAlbumRating)} text-black w-fit px-1 rounded-2xl`}>
            {highestAlbumRating}
          </p>
        </div>
        <div>
          <MinimalAlbumDisplay
            showSubmitInfo
            showAlbumRating={true}
            ratingOverride={lowestAlbumObj["rating"]}
            title={lowestAlbumObj["title"]}
            album_spotify_id={lowestAlbumObj["spotify_id"]}
            album_img_src={lowestAlbumObj["album_img_src"]}
            album_src={lowestAlbumObj["spotify_url"]}
            artist={lowestAlbumObj["artist"]}
            submitter={lowestAlbumObj["submitter"]}
            submitter_comment={lowestAlbumObj["submitter_comment"]}
            submission_date={lowestAlbumObj["submission_date"]}
            historical_date={lowestAlbumObj['date']}
            sizingOverride="w-full h-full"
            buttonUrlOverride={`/dashboard/spotify/calendar/${year}/${month}/${lowestAlbumDateArr[2]}`}
            titleTextOverride="text-center text-xl 2xl:text-2xl text-wrap line-clamp-2"
            artistTextOverride="text-center text-sm 2xl:text-xl italic text-wrap"
            starTextOverride="text-base 2xl:text-3xl"
          />
        </div>
      </div>
    </div>
  )
}