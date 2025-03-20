import { getAOtDByMonth, getReviewStatsByMonth, getSubmissionsByMonth } from "@/app/lib/spotify_utils"
import { daysInMonth, monthToName, padNumber } from "@/app/lib/utils"
import { Conditional } from "@/app/ui/dashboard/conditional"
import PageTitle from "@/app/ui/dashboard/page_title"
import MinimalAlbumDisplay from "@/app/ui/dashboard/spotify/minimal_album_display"
import MonthlyStatsBox from "@/app/ui/dashboard/spotify/statistics_displays/monthly_stats_box"
import { Button, Tooltip } from "@nextui-org/react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { RiArrowLeftCircleLine, RiArrowRightCircleLine, RiThumbDownFill, RiThumbUpFill, RiVipCrownFill } from "react-icons/ri"



// Page to display historial data for a specific month
// Display page showing a table representing a calendar
export default async function Page({
  params,
}: {
  params: { year: string, month: string }
}) {
  const year = (await params).year
  const month = (await params).month
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
    redirect(`/dashboard/spotify/calendar/${today.getFullYear()}/${today.getMonth() + 1}`)
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
    const sizingTailwind = "relative w-full h-full sm:p-1"

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
        <div className={sizingTailwind}>
          <div className="w-full h-full content-center bg-gray-800/30 rounded-2xl border border-neutral-800">
            <p className="invisible sm:visible w-fit m-auto">Previous Month</p>
          </div>
          <div className="absolute bg-zinc-800/90 border border-neutral-800 top-0 p-[2px] sm:p-2 rounded-tl-2xl rounded-br-2xl text-xs sm:text-base">
            <p>{dateArr[2]}</p>
          </div>
        </div>
      )
    }
    // If the album date is greater than today, return a special object for future albums
    if(new Date(Number(dateArr[0]), Number(dateArr[1]) - 1, Number(dateArr[2])) > today) {
      return (
        <div className={sizingTailwind}>
          <MinimalAlbumDisplay
            showAlbumRating={true}
            title={"Future Album"}
            album_img_src={"https://www.placemonkeys.com/500?greyscale&random"}
            artist={{'name': "Monke"}}
            sizingOverride="w-full h-full"
          />
          <div className="absolute sm:left-1 bg-zinc-800/90 border border-neutral-800 top-0 p-[2px] sm:p-2 rounded-tl-2xl rounded-br-2xl text-xs sm:text-base">
            <p>{dateArr[2]}</p>
          </div>
        </div>
      )
    }
    return (
      <div className={sizingTailwind}>
        <MinimalAlbumDisplay
          showSubmitInfo={albumGet("submitter") != null}
          showAlbumRating={true}
          ratingOverride={albumGet("rating")}
          title={albumGet("title")}
          album_spotify_id={albumGet("album_id")}
          album_img_src={albumGet("album_img_src")}
          album_src={albumGet("spotify_url")}
          artist={albumGet("artist")}
          submitter={albumGet("submitter")}
          submitter_comment={albumGet("submitter_comment")}
          submission_date={albumGet("submission_date")}
          historical_date={albumGet('date')}
          sizingOverride="w-full h-full"
          buttonUrlOverride={`/dashboard/spotify/calendar/${year}/${month}/${padNumber(dateArr[2])}`}
          titleTextOverride="text-center text-xl 2xl:text-2xl text-wrap line-clamp-2"
          artistTextOverride="text-center text-sm 2xl:text-xl italic text-wrap"
          starTextOverride="text-base 2xl:text-2xl"
        />
        <div className="absolute sm:left-1 bg-zinc-800/90 border border-neutral-800 top-0 p-[2px] sm:p-2 rounded-tl-2xl rounded-br-2xl text-xs sm:text-base">
          <p>{dateArr[2]}</p>
        </div>
        <Conditional showWhen={dateStr == aotdData['stats']['highest_aotd_date']}>
          <Tooltip content={`Highest Rated Album for ${monthToName(month)} ${year}`}>
            <div className="absolute right-0 sm:-right-1 bg-green-600/90 border border-green-800 top-0 p-[2px] sm:p-2 rounded-tr-2xl rounded-bl-2xl text-xs sm:text-2xl">
              <RiThumbUpFill />
            </div>
          </Tooltip>
        </Conditional>
        <Conditional showWhen={dateStr == aotdData['stats']['lowest_aotd_date']}>
          <Tooltip content={`Lowest Rated Album for ${monthToName(month)} ${year}`}>
            <div className="absolute right-0 sm:-right-1 bg-red-600/90 border border-red-800 top-0 p-[2px] sm:p-2 rounded-tr-2xl rounded-bl-2xl text-xs sm:text-2xl">
              <RiThumbDownFill />
            </div>
          </Tooltip>
        </Conditional>
      </div>
    )
  }


  return (
    <div className="flex flex-col min-h-screen w-full max-w-full 2xl:w-3/4 mx-auto items-center p-3 pb-36 pt-10 ">
      <PageTitle text={`Historical Daily Albums for ${monthName} ${year}`} />
      <div className="flex w-full justify-between">
        <Button 
          as={Link}
          href={`/dashboard/spotify/calendar/${lastMonth.getFullYear()}/${padNumber(Number(lastMonth.getMonth()) + 1)}`}
          radius="lg"
          className={`${(Object.keys(lastMonthAotdData).length == 1) ? "invisible" : ""} w-fit hover:underline text-white`}
          variant="solid"
        >
          <RiArrowLeftCircleLine className="text-2xl" />
        </Button>
        <Button 
          as={Link}
          href={`/dashboard/spotify`}
          radius="lg"
          className={`w-fit hover:underline text-white bg-gradient-to-br from-green-700/80 to-green-800/80`}
          variant="solid"
        >
          <b>Today</b>
        </Button>
        <Button 
          as={Link}
          href={`/dashboard/spotify/calendar/${nextMonth.getFullYear()}/${padNumber(nextMonth.getMonth() + 1)}`}
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