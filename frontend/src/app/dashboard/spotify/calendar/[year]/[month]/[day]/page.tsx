"use server"

import { getAlbumAvgRating, getAlbumOfTheDayData, getAlbumSTD, getDayTimelineData } from "@/app/lib/spotify_utils"
import { getNextDay, getPrevDay, padNumber, ratingToTailwindBgColor } from "@/app/lib/utils"
import { Conditional } from "@/app/ui/dashboard/conditional"
import PageTitle from "@/app/ui/dashboard/page_title"
import AlbumDisplay from "@/app/ui/dashboard/spotify/album_display"
import ReviewDisplay from "@/app/ui/dashboard/spotify/review_display"
import { AOtDScoreTimelineLineChart } from "@/app/ui/dashboard/spotify/statistics_displays/charts/aotd_score_timeline_linechart"
import { Badge, Button, Divider } from "@heroui/react"
import Link from "next/link"
import { RiArrowLeftCircleFill, RiArrowLeftCircleLine, RiArrowRightCircleLine, RiCalendar2Fill } from "react-icons/ri"

// Page to display historial data for an specific date
export default async function Page({
  params,
}: {
  params: { year: string, month: string, day: string }
}) {
  const year = (await params).year
  const month = (await params).month
  const day = (await params).day
  // Decalre date string
  const date = `${year}-${month}-${day}`
  const albumOfTheDayObj = await getAlbumOfTheDayData(date)
  // Get timeline of rating for the day
  const ratingTimeline = await getDayTimelineData(date)
  // Get previous day's date
  const prevDay = getPrevDay(new Date(Date.parse(date)))
  // Get next day's date (null if next day is in the future)
  const nextDay = getNextDay(new Date(Date.parse(date)))
  // Boolean to determine if this date is today
  const isToday = isTodayCheck()
  // Fetch standard deviation for this date
  const standard_deviation = await getAlbumSTD(albumData("album_id"), date)
  

  // This may be my ugliest function in this whole thing.... Timezones are really confusing me
  function isTodayCheck() {
    const date1String = new Date(Date.parse(new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' }).split(",")[0])).toISOString().split('T')[0]
    const splitDate = date.split("-")
    const date2String = new Date(Date.parse(new Date(parseInt(splitDate[0]), parseInt(splitDate[1])-1, parseInt(splitDate[2])).toISOString().split('T')[0])).toISOString().split('T')[0]
    // Return string equals
    return date1String == date2String;
  }

  // Pull data from album object, return empty string if not available
  function albumData(key) {
    if(key in albumOfTheDayObj) {
      return albumOfTheDayObj[key]
    } else { 
      return ""
    }
  }
  
  return (
    <div className="flex flex-col items-center p-3 pb-36 pt-10">
      <PageTitle text={`Historical Album Of the Day Data - ${date}`} />
      <div className="flex flex-col w-fit justify-center md:w-4/5 gap-2">
        <p className="mx-auto px-2 py-2 text-small italic border border-neutral-800 rounded-2xl bg-zinc-800/30">
          You are viewing historical Album Of the Day Data, you cannot make any changes or submit any new data on this page.
        </p>
        <div className="w-fit mx-auto lg:max-w-[1080px] flex flex-col gap-2 lg:flex-row">
          <div className="backdrop-blur-2xl px-3 py-3 my-2 mx-auto rounded-2xl bg-zinc-800/30 border border-neutral-800">
            <div className="mx-1 mt-1 mb-4 flex justify-between w-full">
              {/* Previous Day Button */}
              <Button 
                as={Link}
                href={`/dashboard/spotify/calendar/${prevDay.getFullYear()}/${padNumber(prevDay.getMonth() + 1)}/${padNumber(prevDay.getDate())}`}
                radius="full"
                className={`w-fit hover:underline text-white`}
                variant="solid"
              >
                <RiArrowLeftCircleLine className="text-2xl" />
              </Button>
              {/* Month View Button */}
              <Button 
                as={Link}
                href={`/dashboard/spotify/calendar/${year}/${month}`}
                radius="full"
                className={`w-fit hover:underline text-white bg-gradient-to-br from-green-700/80 to-green-800/80`}
                variant="solid"
              >
                <RiCalendar2Fill className="text-2xl"/>
              </Button>
              {/* Next Day Button */}
              <Button
                as={Link}
                href={`/dashboard/spotify/calendar/${nextDay.getFullYear()}/${padNumber(nextDay.getMonth() + 1)}/${padNumber(nextDay.getDate())}`}
                radius="full"
                className={`${(isToday) ? 'invisible' : ''} w-fit hover:underline text-white`}
                variant="solid"
              >
                <RiArrowRightCircleLine className="text-2xl" />
              </Button> 
            </div>
            <AlbumDisplay
              title={albumData("title")}
              album_id={albumData("album_id")}
              album_img_src={albumData("album_img_src")}
              album_src={albumData("album_src")}
              album_spotify_id={albumData("album_id")}
              artist={albumData("artist")}
              submitter={albumData("submitter")}
              submitter_comment={albumData("submitter_comment")}
              submission_date={albumData("submission_date")}
              release_date={albumData("release_date")}
              release_date_precision={albumData("release_date_precision")}
              historical_date={date}
            />
            <div className="mt-2 w-full md:w-4/5 mx-auto">
              <p className="text-xl lg:text-3xl">Day Stats:</p>
              <Divider />
              <div className="flex w-fit gap-2">
                <p>Standard Deviation: </p>
                <p>{standard_deviation}</p>
              </div>
            </div>
            <div className="flex justify-around mt-4">
              <Button 
                as={Link}
                href={"/dashboard/spotify/album/" + albumData("album_id")}
                radius="lg"
                className={`w-fit hover:underline text-white bg-gradient-to-br from-green-700/80 to-green-800/80`}
                variant="solid"
                isDisabled={albumData("album_id") == null}
              >
                <b>Album Page</b>
              </Button> 
            </div>
          </div>
          <div className="backdrop-blur-2xl px-2 py-2 my-2 mx-auto rounded-2xl bg-zinc-800/30 border border-neutral-800">
            <ReviewDisplay
              album_id={albumData("album_id")}
              date={date}
            />
          </div>
        </div>
        <Conditional showWhen={ratingTimeline.length != 0}>
          <div className="w-full 2xl:w-3/4 mx-auto py-5">
            <div className="pb-5 pt-2 font-extralight text-lg underline">
              <p>Rating Change Timeline:</p>
            </div>
            <AOtDScoreTimelineLineChart
              data={ratingTimeline}
              aotdDate={date}
            />
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