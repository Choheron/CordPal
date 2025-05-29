'use server'

import { deleteAlbumFromBackend, getAlbum, getAlbumAvgRating, getAlbumOfTheDayData, getAotdDates, getSpotifyData } from "@/app/lib/spotify_utils"
import { isUserAdmin, isUserAlbumUploader } from "@/app/lib/user_utils"
import { monthToName, ratingToTailwindBgColor } from "@/app/lib/utils"
import { Conditional } from "@/app/ui/dashboard/conditional"
import PageTitle from "@/app/ui/dashboard/page_title"
import AlbumDisplay from "@/app/ui/dashboard/aotd/album_display"
import AlbumPlayButton from "@/app/ui/dashboard/aotd/album_play_button"
import ReviewDisplay from "@/app/ui/dashboard/aotd/review_display"
import DeleteModal from "@/app/ui/general/modals/delete_modal"
import { Button, Divider } from "@heroui/react"
import Link from "next/link"

// Page to display data for a specific album
export default async function Page({
  params,
}: {
  params: Promise<{ albumid: string }>
}) {
  // Retrieive prop of albumid from url
  const albumid = (await params).albumid
  // Retrieve current user's data
  const spot_user_data = await getSpotifyData()
  // Retrieve data about album from backend
  const albumObj = await getAlbum(albumid)
  // Retrieve aotd_dates list from backend
  const aotd_dates = await getAotdDates(albumid)
  // Store average ratings in object
  let ratingsObj = {}
  for (const date of aotd_dates) {
    ratingsObj[date] = (await getAlbumAvgRating(albumid, false, date)).toFixed(2)
  }
  // Determine if user is admin
  let isAdmin = await isUserAdmin()
  // Determine if user is the uploader of the album
  let isUploader = await isUserAlbumUploader(albumid)
  

  // Box of historical review dates - Generate series of review displays based on dates
  const pastReviewsBox = () => {
    return aotd_dates.reverse().map((date, index) => {
      const dateArr = date.split("-")
      return (
          <div 
            key={index} 
            className="flex flex-col h-fit backdrop-blur-2xl px-2 py-2 my-2 rounded-2xl bg-zinc-800/30 border border-neutral-800"
          >
            <div className="flex w-full">
              <p className={`w-fit h-fit my-auto ${ratingToTailwindBgColor(ratingsObj[date])} px-2 py-1 rounded-full text-black`}>
                <b>{ratingsObj[date]}</b>
              </p>
              <p className="w-fit ml-auto text-xl rounded-tr-2xl rounded-bl-2xl bg-zinc-800/30 border border-neutral-800 px-2 -mr-2 py-2 -mt-2">
                {monthToName(dateArr[1])} {dateArr[2]}, {dateArr[0]}
              </p>
            </div>
            <ReviewDisplay
              album_id={albumData("album_id")}
              date={date}
            />
            <Divider className="mb-2" />
            <Button
              as={Link}
              href={`/dashboard/aotd/calendar/${dateArr[0]}/${dateArr[1]}/${dateArr[2]}`}
              className={`bg-gradient-to-br from-green-700/80 to-green-800/80 text-black w-1/2 mx-auto`}
              variant="solid"
            >
              <b>View Day Page</b>
            </Button>
          </div>
      )
    })
  }

  // Pull data from album object, return empty string if not available
  function albumData(key) {
    if(key in albumObj) {
      return albumObj[key]
    } else { 
      return ''
    }
  }

  // Handle deletion of album by making a backend request to delete the album
  const handleDelete = async (reason) => {
    "use server"
    console.log(`Delete confimed for album ${albumid}...`)
    const status = deleteAlbumFromBackend(albumid, reason)
    return status
  }
  
  return (
    <div className="flex flex-col items-center p-3 pb-36 pt-10">
      <PageTitle text={`${albumData("title")}`} />
      <div className="flex flex-col w-fit justify-center md:w-4/5 gap-2">
        <div className="flex mx-auto">
          <div className="relative w-fit lg:max-w-[1080px] flex flex-col gap-2 lg:flex-row backdrop-blur-2xl px-2 py-2 my-2 rounded-2xl bg-zinc-800/30 border border-neutral-800">
            <AlbumDisplay 
              title={albumData("title")}
              album_img_src={albumData("album_img_src")}
              album_src={albumData("album_src")}
              artist={albumData("artist")}
              submitter={albumData("submitter")}
              submitter_comment={albumData("submitter_comment")}
              submission_date={albumData("submission_date")}
              release_date={albumData('release_date')}
              release_date_precision={albumData("release_date_precision")}
              trackCount={JSON.parse(albumData("raw_album_data"))['album']['total_tracks']}
            />
            <div className="absolute bottom-1 right-1">
              <AlbumPlayButton 
                spotUserData={spot_user_data}
                albumOfTheDayObj={albumObj}
              />
            </div>
            <Conditional showWhen={isAdmin || isUploader}>
              <div className="absolute -top-1 right-1 ">
                <DeleteModal 
                  confirmCallback={handleDelete}
                  cancelCallback={null}
                  isButtonDisabled={aotd_dates.length > 0}
                  tooltipContent={(aotd_dates.length > 0) ? "Album cannot be deleted, it has been AOtD!" : "Delete Album"}
                  titleText={`Delete "${albumData('title')}"?`}
                  bodyText={`Are you sure you want to delete "${albumData('title')}"? You cannot undo this action.`}
                  redirectText={'/dashboard/aotd'}
                  textboxDescription={"Reason for deletion (Optional)"}
                  textboxPlaceholder="(Optional) Input a reason for deleting the album."
                />
              </div>
            </Conditional>
          </div>
        </div>
        <Conditional showWhen={aotd_dates.length > 0}>
          <div className='w-full'>
            <p className='text-2xl w-fit mx-auto font-extralight'>
              Previous Album of the Day Appearances
            </p>
            <div className="flex justify-around">
              {pastReviewsBox()}
            </div>
          </div>
        </Conditional>
        <Button 
          as={Link}
          href={"/dashboard/aotd"}
          radius="lg"
          className="w-fit mx-auto hover:underline" 
          variant="bordered"
        >
          Return to Main Page
        </Button> 
      </div>
    </div>    
  )
}