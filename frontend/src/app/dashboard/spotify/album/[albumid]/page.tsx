import { getAlbum, getAlbumAvgRating, getAlbumOfTheDayData, getAotdDates } from "@/app/lib/spotify_utils"
import { monthToName, ratingToTailwindBgColor } from "@/app/lib/utils"
import { Conditional } from "@/app/ui/dashboard/conditional"
import PageTitle from "@/app/ui/dashboard/page_title"
import AlbumDisplay from "@/app/ui/dashboard/spotify/album_display"
import ReviewDisplay from "@/app/ui/dashboard/spotify/review_display"
import { Badge, Button, Divider } from "@nextui-org/react"
import Link from "next/link"

// Page to display data for a specific album
export default async function Page({
  params,
}: {
  params: Promise<{ albumid: string }>
}) {
  // Retrieive prop of albumid from url
  const albumid = (await params).albumid
  // Retrieve data about album from backend
  const albumObj = await getAlbum(albumid)
  // Retrieve aotd_dates list from backend
  const aotd_dates = await getAotdDates(albumid)
  // Store average ratings in object
  let ratingsObj = {}
  for (const date of aotd_dates) {
    ratingsObj[date] = (await getAlbumAvgRating(albumid, false, date)).toFixed(2)
  }
  

  // Box of historical review dates - Generate series of review displays based on dates
  const pastReviewsBox = () => {
    return aotd_dates.map((date, index) => {
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
              href={`/dashboard/spotify/calendar/${dateArr[0]}/${dateArr[1]}/${dateArr[2]}`}
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
  
  return (
    <div className="flex min-h-screen flex-col items-center p-3 pb-36 pt-10">
      <PageTitle text={`${albumData("title")}`} />
      <div className="flex flex-col w-fit justify-center md:w-4/5 gap-2">
        <div className="w-fit mx-auto lg:max-w-[1080px] flex flex-col gap-2 lg:flex-row backdrop-blur-2xl px-2 py-2 my-2 rounded-2xl bg-zinc-800/30 border border-neutral-800">
          <AlbumDisplay 
            title={albumData("title")}
            album_img_src={albumData("album_img_src")}
            album_src={albumData("album_src")}
            artist={albumData("artist")}
            submitter={albumData("submitter")}
            submitter_comment={albumData("submitter_comment")}
            submission_date={albumData("submission_date")}
          />
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
          href={"/dashboard/spotify"}
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