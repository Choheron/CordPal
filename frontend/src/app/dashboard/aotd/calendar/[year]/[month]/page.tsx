"use server"

import { getAOtDByMonth, getReviewStatsByMonth, getSubmissionsByMonth } from "@/app/lib/aotd_utils"
import { daysInMonth, monthToName, padNumber, ratingToTailwindBgColor } from "@/app/lib/utils"
import { Conditional } from "@/app/ui/dashboard/conditional"
import PageTitle from "@/app/ui/dashboard/page_title"
import MinimalAlbumDisplay from "@/app/ui/dashboard/aotd/minimal_album_display"
import MonthlyStatsBox from "@/app/ui/dashboard/aotd/statistics_displays/monthly_stats_box"
import { Button, Tooltip } from "@heroui/react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { RiArrowLeftCircleLine, RiArrowRightCircleLine, RiThumbDownFill, RiThumbUpFill, RiVipCrownFill } from "react-icons/ri"



// Page to display historial data for a specific month
// Display page showing a table representing a calendar
export default async function Page({
  params,
}: {
  params: Promise<{ year: string, month: string }> 
}) {
  const { year, month } = (await params)
  // Get month and day data
  const monthName = monthToName(month)
  const dayCount = daysInMonth(year, month)
  // Get this month first day
  const firstDay = new Date(Number(year), Number(month) - 1, 1)
  // Get Today's Date
  const today = new Date()
  // Get previous month date 
  const lastMonth = new Date(new Date(firstDay).setMonth(firstDay.getMonth() - 1));
  // Get next month date
  const nextMonth = new Date(new Date(firstDay).setMonth(firstDay.getMonth() + 1));
  // Boolean to see if the viewed month is the current month
  const currMonth = ((new Date().getMonth() + 1) == Number(month))

  // Data retrieval from backend
  // Retrieve album data for this month
  const aotdData = await getAOtDByMonth(year, padNumber(Number(month)))
  // Get last month's data to see if there are any albums there TODO: Make this not such a HUGE call
  const lastMonthAotdData = await getAOtDByMonth(`${lastMonth.getFullYear()}`, padNumber(Number(lastMonth.getMonth() + 1)))

  // If the user isnt supposed to be here, redirect them to the current month's page
  if((firstDay > today) || ((Object.keys(aotdData).length == 1))) {
    redirect(`/dashboard/aotd/calendar/${today.getFullYear()}/${today.getMonth() + 1}`)
  }

  // Populate an array containing strings of dates (YYYY-MM-DD) that corresponds to where to place the days in the UI
  // Array will contain subarrays containing data from sat to sun (one week)
  let dates: any = [[],[],[],[],[],[]]
  let weekIndex = 0
  let dayIndex = 1
  for(dayIndex; dayIndex <= dayCount; dayIndex++) {
    const date = new Date(Number(year), Number(month) - 1, dayIndex)
    const dayOfWeek = date.getDay()
    // Special if block for if day is first day
    if(dayIndex == 1) {
      let x = 0
      while(x < dayOfWeek) {
        // THIS IS UGLY WHAT AM I DOING LOL
        dates[weekIndex].push(`${lastMonth.getFullYear()}-${padNumber(lastMonth.getMonth() + 1)}-${padNumber((new Date(new Date().setDate(firstDay.getDate() - (dayOfWeek - (x)))).getDate()))}`)
        x++;
      }
    }
    // Add date to array
    dates[weekIndex].push(`${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())}`)
    // Increment week index if day is a sunday
    if(date.getDay() == 6) {
      weekIndex++;
    }
  }

  // Generate a calendar for the month
  const genCalendar = () => {
    return dates.map((week, wi) => {
      return (
        <tr key={wi} >
          {week.map((day, di) => {
            return (
              <td 
                key={di}
                className=""  
              >
                {genDay(day)}
              </td>
            )
          })}
        </tr>
      )
    })
  }

  // Generate a day
  const genDay = (dateStr) => {
    const albumObj = aotdData[dateStr]
    const dateArr = dateStr.split("-")
    const sizingTailwind = "relative w-full max-w-full h-full"

    // Return a field value from the album object or null
    function albumGet(field) {
      if(albumObj) {
        return albumObj[field]
      }
      return null
    }

    // If the album date is from last month, return a text block
    if(dateStr.split("-")[1] != (firstDay.getMonth() + 1)) {
      return (
        <></>
      )
    }

    const getDayHtml = () => {
      // If the album date is greater than today, return a special object for future albums
      if(new Date(Number(dateArr[0]), Number(dateArr[1]) - 1, Number(dateArr[2])) > today) {
        return (
          <div className={sizingTailwind}>
            <MinimalAlbumDisplay
              showAlbumRating={true}
              title={"Future Album"}
              album_img_src={`https://www.placemonkeys.com/500?greyscale&random=${dateArr[2]}`}
              artist={{'name': "Monke"}}
              sizingOverride="w-full h-full"
              albumCoverOverride="rounded-b-2xl"
            />
          </div>
        )
      }
      return (
        <div className={sizingTailwind}>
          {/* Album Body */}
          <MinimalAlbumDisplay
            showSubmitInfo={albumGet("submitter") != null}
            showAlbumRating={true}
            ratingOverride={albumGet("rating")}
            title={albumGet("title")}
            album_mbid={albumGet("album_id")}
            album_img_src={`/dashboard/aotd/api/album-cover/${albumGet("album_id")}`}
            album_src={albumGet("album_src")}
            artist={albumGet("artist")}
            submitter={albumGet("submitter")}
            submitter_comment={albumGet("submitter_comment")}
            submission_date={albumGet("submission_date")}
            historical_date={albumGet('date')}
            sizingOverride="w-full h-full"
            albumCoverOverride="rounded-b-2xl"
            buttonUrlOverride={`/dashboard/aotd/calendar/${year}/${month}/${padNumber(dateArr[2])}`}
            titleTextOverride="text-center text-xl 2xl:text-2xl text-wrap line-clamp-2"
            artistTextOverride="text-center text-sm 2xl:text-xl italic text-wrap"
            starTextOverride="text-base 2xl:text-2xl"
          />
        </div>
      )
    }

    const is_highest_or_lowest = ((dateStr == aotdData['stats']['highest_aotd_date']) || (dateStr == aotdData['stats']['lowest_aotd_date']))
    return (
      <div className="rounded-2xl sm:px-[2px] md:px-1 max-w-full max-h-full">
        {/* Day Header */}
        <div className="relative bg-neutral-800 rounded-tl-2xl rounded-tr-2xl h-fit">
          <div className="p-[2px] sm:p-2 w-fit sm:min-w-10 text-center bg-zinc-900/90 border border-zinc-900 rounded-t-2xl rounded-br-2xl text-xs sm:text-base">
            <p>{dateArr[2]}</p>
          </div>
          <Conditional showWhen={albumGet("rating") != null}>
            <div className={`absolute p-[2px] sm:p-2 w-fit sm:min-w-10 mx-auto ${(is_highest_or_lowest) ? "left-0 rounded-2xl" : "rounded-t-2xl rounded-bl-2xl"} right-0 text-center ${ratingToTailwindBgColor(albumGet("rating"))} bg-opacity-65 top-0 text-xs md:text-base`}>
              <p>{albumGet("rating")?.toFixed(2)}</p>
            </div>
          </Conditional>
          <Conditional showWhen={dateStr == aotdData['stats']['highest_aotd_date']}>
            <Tooltip content={`Highest Rated Album for ${monthToName(month)} ${year}`}>
              <div className="absolute right-0 bg-green-600/90 border border-green-800 top-0 p-[2px] sm:p-2 rounded-t-2xl rounded-bl-2xl text-xs sm:text-2xl">
                <RiThumbUpFill />
              </div>
            </Tooltip>
          </Conditional>
          <Conditional showWhen={dateStr == aotdData['stats']['lowest_aotd_date']}>
            <Tooltip content={`Lowest Rated Album for ${monthToName(month)} ${year}`}>
              <div className="absolute right-0 bg-red-600/90 border border-red-800 top-0 p-[2px] sm:p-2 rounded-t-2xl rounded-bl-2xl text-xs sm:text-2xl">
                <RiThumbDownFill />
              </div>
            </Tooltip>
          </Conditional>
        </div>
        {/* Day Body */}
        <div className={sizingTailwind}>
          {getDayHtml()}
        </div>
      </div>
    )
  }


  return (
    <div className="flex flex-col w-full max-w-full 2xl:w-3/4 mx-auto items-center p-3 pb-36 pt-10 ">
      <PageTitle text={`Historical Daily Albums for ${monthName} ${year}`} />
      <div className="flex w-full justify-between">
        <Button 
          as={Link}
          href={`/dashboard/aotd/calendar/${lastMonth.getFullYear()}/${padNumber(Number(lastMonth.getMonth()) + 1)}`}
          radius="lg"
          className={`${(Object.keys(lastMonthAotdData).length == 1) ? "invisible" : ""} w-fit hover:underline text-white`}
          variant="solid"
        >
          <RiArrowLeftCircleLine className="text-2xl" />
        </Button>
        <Button 
          as={Link}
          href={`/dashboard/aotd`}
          radius="lg"
          className={`w-fit hover:underline text-white bg-gradient-to-br from-green-700/80 to-green-800/80`}
          variant="solid"
        >
          <b>Today</b>
        </Button>
        <Button 
          as={Link}
          href={`/dashboard/aotd/calendar/${nextMonth.getFullYear()}/${padNumber(nextMonth.getMonth() + 1)}`}
          radius="lg"
          className={`${(currMonth) ? "invisible" : ""} w-fit hover:underline text-white `}
          variant="solid"
        >
          <RiArrowRightCircleLine className="text-2xl" />
        </Button>
      </div>
      <table className="w-full h-full table-fixed mx-auto sm:border-separate">
        <thead>
          <tr>
            <th className="rounded-2xl bg-zinc-800/50 font-extralight py-2 truncate">Sunday</th>
            <th className="rounded-2xl bg-zinc-800/50 font-extralight py-2 truncate">Monday</th>
            <th className="rounded-2xl bg-zinc-800/50 font-extralight py-2 truncate">Tuesday</th>
            <th className="rounded-2xl bg-zinc-800/50 font-extralight py-2 truncate">Wednesday</th>
            <th className="rounded-2xl bg-zinc-800/50 font-extralight py-2 truncate">Tursday</th>
            <th className="rounded-2xl bg-zinc-800/50 font-extralight py-2 truncate">Friday</th>
            <th className="rounded-2xl bg-zinc-800/50 font-extralight py-2 truncate">Saturday</th>
          </tr>
        </thead>
        <tbody>
          {genCalendar()}
        </tbody>
      </table>
      {/* Monthly Statistics */}
      <MonthlyStatsBox aotdData={aotdData} year={year} month={month}/>
    </div>
  )
}