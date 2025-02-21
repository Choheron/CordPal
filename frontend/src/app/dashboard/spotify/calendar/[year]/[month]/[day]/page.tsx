import { getAlbumAvgRating, getAlbumOfTheDayData } from "@/app/lib/spotify_utils"
import { getNextDay, getPrevDay, padNumber, ratingToTailwindBgColor } from "@/app/lib/utils"
import PageTitle from "@/app/ui/dashboard/page_title"
import AlbumDisplay from "@/app/ui/dashboard/spotify/album_display"
import ReviewDisplay from "@/app/ui/dashboard/spotify/review_display"
import { Badge, Button } from "@nextui-org/react"
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
  // Get previous day's date
  const prevDay = getPrevDay(new Date(Date.parse(date)))
  // Get next day's date (null if next day is in the future)
  const nextDay = getNextDay(new Date(Date.parse(date)))
  // Boolean to determine if this date is today
  const isToday = isTodayCheck()

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
    <div className="flex min-h-screen flex-col items-center p-3 pb-36 pt-10">
      <PageTitle text={`Historical Album Of the Day Data - ${date}`} />
      <div className="flex flex-col w-fit justify-center md:w-4/5 gap-2">
        <p className="mx-auto px-2 py-2 text-small italic border border-neutral-800 rounded-2xl bg-zinc-800/30">
          You are viewing historical Album Of the Day Data, you cannot make any changes or submit any new data on this page.
        </p>
        <div className="w-fit mx-auto lg:max-w-[1080px] flex flex-col gap-2 lg:flex-row">
          <div className="backdrop-blur-2xl px-3 py-3 my-2 mx-auto rounded-2xl bg-zinc-800/30 border border-neutral-800">
            <div className="mx-1 mt-1 mb-4 flex justify-between w-full">
              <Button 
                as={Link}
                href={`/dashboard/spotify/calendar/${prevDay.getFullYear()}/${padNumber(prevDay.getMonth() + 1)}/${padNumber(prevDay.getDate() + 1)}`}
                radius="full"
                className={`w-fit hover:underline text-white`}
                variant="solid"
              >
                <RiArrowLeftCircleLine className="text-2xl" />
              </Button>
              <Button 
                as={Link}
                href={`/dashboard/spotify/calendar/${year}/${month}`}
                radius="full"
                className={`w-fit hover:underline text-white bg-gradient-to-br from-green-700/80 to-green-800/80`}
                variant="solid"
              >
                <RiCalendar2Fill className="text-2xl"/>
              </Button>
              <Button
                as={Link}
                href={`/dashboard/spotify/calendar/${nextDay.getFullYear()}/${padNumber(nextDay.getMonth() + 1)}/${padNumber(nextDay.getDate() + 1)}`}
                radius="full"
                className={`${(isToday) ? 'invisible' : ''} w-fit hover:underline text-white`}
                variant="solid"
              >
                <RiArrowRightCircleLine className="text-2xl" />
              </Button> 
            </div>
            <Badge
              content={(await getAlbumAvgRating(albumData('album_id'), false)).toFixed(2)} 
              size="lg" 
              placement="top-left" 
              shape="rectangle"
              showOutline={false}
              variant="shadow"
              className={`lg:-ml-4 -mt-1 ${ratingToTailwindBgColor((await getAlbumAvgRating(albumData('album_id'), false)).toFixed(2))} lg:text-xl text-black`}
              isInvisible={albumData("title") == ""}
            >
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
            </Badge>
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
            />
          </div>
        </div>
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