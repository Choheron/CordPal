"use server"

import { Alert } from "@heroui/alert";
import { Button } from "@heroui/button";

import AlbumDisplay from "./album_display";
import AlbumReviewBox from "./album_review_box";
import ReviewDisplay from "./review_display";
import { 
  getAlbumOfTheDayData, 
  getReviewsForAlbum, 
  getSimilarReviewsForRatings, 
  getUserReviewForAlbum, 
} from "@/app/lib/aotd_utils";
import AddAlbumModal from "./modals/add_album_modal";

import Link from "next/link";
import { RiCalendar2Fill} from "react-icons/ri";
import { getUserData, isUserAdmin } from "@/app/lib/user_utils";
import { Conditional } from "../conditional";
import ReplaceAlbumModal from "./modals/replace_album_modal";
import { revalidateTag } from "next/cache";
import { getYesterdayInTimezone } from "@/app/lib/utils";

// GUI Display for the Album of the Day
export default async function AlbumOfTheDayBox(props) {
  // Check if current user is an Admin User
  const isAdmin = await isUserAdmin()
  // Get user Data
  const user_data = await getUserData()
  // Get album data
  const albumOfTheDayObj = await getAlbumOfTheDayData()
  const albumReview = await getUserReviewForAlbum(albumData("album_id"))
  const similarReviewData = await getSimilarReviewsForRatings(user_data['discord_id'])
  // Retrieve review data on this level instead of at reviewbox level
  let reviewList = await getReviewsForAlbum(albumData("album_id"));

  // Get Todays Date
  let todayDate = new Date()
  // Get yesterday's date
  const yesterdayString = getYesterdayInTimezone("America/Chicago");
  const yesterdayStringArr = yesterdayString.split("-")

  // Pull data from album object, return empty string if not available
  function albumData(key) {
    if(key in albumOfTheDayObj) {
      return albumOfTheDayObj[key]
    } else { 
      return ''
    }
  }

  // Callback to revalidate AOTD if replaced
  async function revalidateAOTD() {
    "use server";
    revalidateTag('AOTD', "max")
  }

  return (
    <div className="w-fit flex flex-col lg:flex-row lg:gap-2">
      <div className="backdrop-blur-2xl px-2 py-2 my-2 rounded-2xl bg-zinc-800/30 border border-neutral-800">
        <div className="relative w-full flex flex-col">
          <Conditional showWhen={isAdmin}>
            <div className="absolute bottom-0 right-0">
              <ReplaceAlbumModal
                albumObj={albumOfTheDayObj}
                isButtonDisabled={!isAdmin}
                isCurrentlyAOTD={true}
                serverCallback={revalidateAOTD}
              />
            </div>
          </Conditional>
          <div className="flex flex-col md:flex-row w-full justify-between px-2 mt-1 mb-1">
            <Link
              href={`/dashboard/aotd/calendar/${yesterdayStringArr[0]}/${yesterdayStringArr[1]}/${yesterdayStringArr[2]}`}
            >
              <Button
                radius="lg"
                className={`min-w-fit hover:underline text-white bg-gradient-to-br from-green-700/80 to-green-800/80`}
                variant="solid"
              >
                <b>Yesterday&apos;s Album</b>
              </Button>
            </Link>
            <div className="w-full backdrop-blur-2xl px-2 py-1 md:mx-2 my-2 md:my-0 rounded-2xl bg-black/20 border border-neutral-800">
              <p className="text-xs italic text-gray-300">
                All album artwork, track titles, artist names, and related content are the property of their respective copyright holders.
              </p>
            </div>
            <Link
              href={`/dashboard/aotd/calendar/${todayDate.toISOString().split('T')[0].split("-")[0]}/${todayDate.toISOString().split('T')[0].split("-")[1]}`}
            >
              <Button 
                radius="lg"
                className={`min-w-fit hover:underline text-white bg-gradient-to-br from-green-700/80 to-green-800/80`}
                variant="solid"
              >
                <RiCalendar2Fill className="text-2xl" />
              </Button>
            </Link>
          </div>
          <Conditional showWhen={albumOfTheDayObj['manually_selected'] && albumOfTheDayObj['admin_message']}>
            <Alert
              className="w-full gap-2 text-sm mb-2"
              color="primary"
              radius="md"
              hideIcon={true}
            >
              <div className="flex gap-2">
                <p className="text-2xl">&#8505;</p>
                <div className="">
                  <p className="text-xs pt-1"><b>This album was manually selected by admins for this date. Reason:</b></p>
                  <p className="my-auto">
                    {albumOfTheDayObj['admin_message']}
                  </p>
                </div>
              </div>
            </Alert>
          </Conditional>
          <AlbumDisplay 
            title={albumData("title")}
            disambiguation={albumData("disambiguation")}
            album_img_src={albumData("album_img_src")}
            album_id={albumData("album_id")}
            album_src={`/dashboard/aotd/album/${albumData("album_id")}`}
            album_mbid={albumData("album_id")}
            artist={albumData("artist")}
            submitter={albumData("submitter")}
            submitter_comment={albumData("submitter_comment")}
            submission_date={albumData("submission_date")}
            release_date={albumData("release_date")}
            release_date_precision={albumData("release_date_precision")}
            trackList={albumData("track_list")['tracks']}
          />
          <div className="w-full max-w-full">
            <AlbumReviewBox 
              album_id={albumData("album_id")}
              user_data={user_data}
              rating={(albumReview != null) ? albumReview['score'] : null}
              comment={(albumReview != null) ? albumReview['comment'] : null}
              isAdvanced={(albumReview != null) ? albumReview['advanced'] : null}
              first_listen={(albumReview != null) ? albumReview['first_listen']: null}
              similar_review_data={similarReviewData}
              hasUserSubmitted={(albumReview != null) ? albumReview['backendExist']: null}
              song_data={
                albumData("track_list")['tracks'].map((trackData) => (
                  {
                    "number": trackData['number'],
                    "position": trackData['position'],
                    "title": trackData['title'],
                    "cordpal_rating": ((albumReview != null) && (albumReview['trackData'] != null) && (albumReview['trackData'][trackData['title']] != null)) ? albumReview['trackData'][trackData['title']]['cordpal_rating'] : 2,
                    "cordpal_comment": ((albumReview != null) && (albumReview['trackData'] != null) && (albumReview['trackData'][trackData['title']] != null)) ? albumReview['trackData'][trackData['title']]['cordpal_comment'] : "No Comment Provided..."
                  }
                ))
              }
            />
          </div>
          <div className="w-full flex">
            <AddAlbumModal />
          </div>
        </div>
      </div>
      <div className="static w-full lg:w-fit backdrop-blur-2xl px-2 py-2 mt-0 lg:my-2 rounded-2xl bg-zinc-800/30 border border-neutral-800">
        <ReviewDisplay 
          review_list={reviewList}
        />
      </div>
    </div>
  )
}