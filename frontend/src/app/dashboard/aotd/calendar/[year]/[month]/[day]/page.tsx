"use server"

import { Alert } from "@heroui/alert"
import { Button } from "@heroui/button"
import { Divider } from "@heroui/divider"

import { getAlbumOfTheDayData, getAlbumSTD, getDayTimelineData, getTagsForAlbum, getAotdUserSettings, isAotdParticipant, getAlbumCommentAtDate } from "@/app/lib/aotd_utils"
import { getNextDay, getPrevDay, getLastYearInTimezone, padNumber, ratingToTailwindBgColor } from "@/app/lib/utils"
import { getHasReviewedToday, getUserData, isUserAdmin } from "@/app/lib/user_utils"
import { Conditional } from "@/app/ui/dashboard/conditional"
import PageTitle from "@/app/ui/dashboard/page_title"
import AlbumDisplay from "@/app/ui/dashboard/aotd/album_display"
import ReviewDisplay from "@/app/ui/dashboard/aotd/review_display"
import { AOtDScoreTimelineLineChart } from "@/app/ui/dashboard/aotd/statistics_displays/charts/aotd_score_timeline_linechart"
import Link from "next/link"
import { RiArrowLeftCircleLine, RiArrowRightCircleLine, RiCalendar2Fill } from "react-icons/ri"
import AlbumTagsDisplay from "@/app/ui/dashboard/aotd/album_tags"

// Page to display historial data for an specific date
export default async function Page({
  params,
}: {
  params: Promise<{ year: string, month: string, day: string }> 
}) {
  const { year, month, day } = (await params)
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
  // Boolean to determine if this date is exactly one year ago today
  const isYearAgo = date === getLastYearInTimezone("America/Chicago")
  // Fetch standard deviation for this date
  const standard_deviation = (albumData("album_id")) ? await getAlbumSTD(albumData("album_id"), date) : "N/A"
  // Get tags for album
  const albumTags = await getTagsForAlbum(albumData("album_id"));
  // Check if current user is an Admin User
  const [isAdmin, user_data] = await Promise.all([isUserAdmin(), getUserData()])
  // Fetch the comment that was in effect on this AOTD date (may differ from current if edited later)
  const commentData = albumData("album_id")
    ? await getAlbumCommentAtDate(albumData("album_id"), date)
    : { comment: albumData("submitter_comment"), was_updated_since_aotd: false }

  // Hide scores/tags only when viewing today's AOTD and the user's settings say to hide pre-review.
  // For any historical date, isToday is false so hideScore/hideTags remain false.
  let hideScore = false
  let hideTags = false
  if (isToday && await isAotdParticipant()) {
    const [aotdSettings, hasReviewedToday] = await Promise.all([
      getAotdUserSettings(),
      getHasReviewedToday(),
    ])
    hideScore = aotdSettings['hide_scores_prereview'] && !hasReviewedToday
    hideTags = aotdSettings['hide_tags_prereview'] && !hasReviewedToday
  }


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
        {(isYearAgo) ? (
          <p className="mx-auto px-2 py-2 text-small italic border border-neutral-800 rounded-2xl bg-zinc-800/30">
            You are viewing historical Album Of the Day Data. This album was AOTD one year ago, as such, you can edit tags and vote on tags for this album.
          </p>
        ) : (
          <p className="mx-auto px-2 py-2 text-small italic border border-neutral-800 rounded-2xl bg-zinc-800/30">
            You are viewing historical Album Of the Day Data, you cannot make any changes or submit any new data on this page.
          </p>
        )}
        <Link
          href={"/dashboard/aotd"}
          className="text-center"
        >
          <Button 
            radius="lg"
            className="w-fit mx-auto hover:underline" 
            variant="bordered"
          >
            Return to Main Page
          </Button>
        </Link>
        <div className="w-fit mx-auto lg:max-w-[1080px] flex flex-col gap-2 lg:flex-row">
          <div className="backdrop-blur-2xl px-3 py-3 my-2 mx-auto rounded-2xl bg-zinc-800/30 border border-neutral-800">
            <div className="mx-1 mt-1 mb-4 flex justify-between w-full">
              {/* Previous Day Button */}
              <Link
                href={`/dashboard/aotd/calendar/${prevDay.getFullYear()}/${padNumber(prevDay.getMonth() + 1)}/${padNumber(prevDay.getDate())}`}
              >
                <Button
                  radius="full"
                  className={`w-fit hover:underline text-white`}
                  variant="solid"
                >
                  <RiArrowLeftCircleLine className="text-2xl" />
                </Button>
              </Link>
              {/* Month View Button */}
              <Link
                href={`/dashboard/aotd/calendar/${year}/${month}`}
              >
                <Button
                  radius="full"
                  className={`w-fit hover:underline text-white bg-gradient-to-br from-green-700/80 to-green-800/80`}
                  variant="solid"
                >
                  <RiCalendar2Fill className="text-2xl"/>
                </Button>
              </Link>
              {/* Next Day Button */}
              <Link
                href={`/dashboard/aotd/calendar/${nextDay.getFullYear()}/${padNumber(nextDay.getMonth() + 1)}/${padNumber(nextDay.getDate())}`}
              >
                <Button
                  radius="full"
                  className={`${(isToday) ? 'invisible' : ''} w-fit hover:underline text-white`}
                  variant="solid"
                >
                  <RiArrowRightCircleLine className="text-2xl" />
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
              album_id={albumData("album_id")}
              album_img_src={albumData("album_img_src")}
              album_src={albumData("album_src")}
              album_mbid={albumData("album_id")}
              artist={albumData("artist")}
              submitter={albumData("submitter")}
              submitter_comment={commentData.comment ?? albumData("submitter_comment")}
              submission_date={albumData("submission_date")}
              release_date={albumData("release_date")}
              release_date_precision={albumData("release_date_precision")}
              historical_date={date}
              hideScore={hideScore}
            />
            <Conditional showWhen={commentData.was_updated_since_aotd}>
              <div className="text-xs italic text-gray-400 px-2 pb-2">
                This submission message has been updated since this AOTD date.{" "}
                <Link href={`/dashboard/aotd/album/${albumData("album_id")}`} className="underline">
                  View current message.
                </Link>
              </div>
            </Conditional>
            <Conditional showWhen={isYearAgo} >
              <p className="w-full text-xs text-gray-500 italic text-center">This album was AOTD a year ago today! You can edit tags on this album.</p>
            </Conditional>
            <div className="w-full max-w-full">
              <AlbumTagsDisplay
                mbid={albumData("album_id")}
                initialTags={albumTags ?? []}
                isEnrolled={true}
                isAdmin={isAdmin}
                currentUserId={isYearAgo ? user_data['discord_id'] : undefined}
                readOnly={!isYearAgo}
                hideTags={hideTags}
              />
            </div>
            <div className="mt-2 w-full md:w-4/5 mx-auto">
              <p className="text-xl lg:text-3xl">Day Stats:</p>
              <Divider />
              <div className="flex w-fit gap-2">
                <p>Standard Deviation: </p>
                <p>{standard_deviation}</p>
              </div>
            </div>
            <div className="flex justify-around mt-4">
              <Link
                href={"/dashboard/aotd/album/" + albumData("album_id")}
              >
                <Button 
                  radius="lg"
                  className={`w-fit hover:underline text-white bg-gradient-to-br from-green-700/80 to-green-800/80`}
                  variant="solid"
                  isDisabled={albumData("album_id") == null}
                >
                  <b>Album Page</b>
                </Button>
              </Link>
            </div>
          </div>
          <div className="backdrop-blur-2xl px-2 py-2 my-2 mx-auto rounded-2xl bg-zinc-800/30 border border-neutral-800">
            <ReviewDisplay
              album_id={albumData("album_id")}
              date={date}
              historical={true}
              hideScore={hideScore}
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
      </div>
    </div>    
  )
}