import { getAOtDByMonth } from "@/app/lib/spotify_utils"
import { daysInMonth, monthToName, padNumber } from "@/app/lib/utils"
import { Conditional } from "@/app/ui/dashboard/conditional"
import PageTitle from "@/app/ui/dashboard/page_title"
import MinimalAlbumDisplay from "@/app/ui/dashboard/spotify/minimal_album_display"
import { Button } from "@nextui-org/react"
import Link from "next/link"



// Page to display historial data for a specific month
// Display page showing a table representing a calendar
export default async function Page({
  params,
}: {
  params: { year: string, month: string }
}) {
  const year = (await params).year
  const month = (await params).month
  const monthName = monthToName(month)
  const dayCount = daysInMonth(year, month)
  // Retrieve album data for this month
  const aotdData = await getAOtDByMonth(year, padNumber(Number(month)))
  // Get this month first day
  const firstDay = new Date(Number(year), Number(month) - 1, 1)
  // Get previous month date 
  const lastMonth = new Date(new Date(firstDay).setMonth(firstDay.getMonth()));
  // Get next month date
  const nextMonth = new Date(new Date(firstDay).setMonth(firstDay.getMonth() + 1));
  // Boolean to see if the viewed month is the current month
  const currMonth = ((new Date().getMonth() + 1) == Number(month))

  // Populate an array containing strings of dates (YYYY-MM-DD) that corresponds to where to place the days in the UI
  // Array will contain subarrays containing data from sat to sun (one week)
  let dates: any = [[],[],[],[],[]]
  let weekIndex = 0
  let dayIndex = 1
  for(dayIndex; dayIndex <= dayCount; dayIndex++) {
    const date = new Date(Number(year), Number(month) - 1, dayIndex)
    const dayOfWeek = date.getDay()
    // Special if block for if day is first day
    if(dayIndex == 1) {
      let x = 0
      while(x < dayOfWeek) {
        dates[weekIndex].push("-")
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
    
    return (
      <div className="relative w-full h-full mx-2 p-1">
        {
          (!albumObj) ? (
            <div className="w-full h-full">
              <p className="w-full h-full text-center align-middle">
                No Album Of the Day
              </p>
            </div>
          ):(
            <MinimalAlbumDisplay
              showAlbumRating={true}
              title={albumObj["title"]}
              album_spotify_id={albumObj["album_id"]}
              album_img_src={albumObj["album_img_src"]}
              album_src={albumObj["spotify_url"]}
              artist={albumObj["artist"]}
              submitter={albumObj["submitter_id"]}
              submitter_comment={albumObj["submitter_comment"]}
              submission_date={albumObj["submission_date"]}
              historical_date={albumObj['date']}
              sizingOverride="w-full h-full"
            />
          )
        }
        <div className="absolute left-1 bg-zinc-800/90 border border-neutral-800 top-0 p-2 rounded-tl-2xl rounded-br-2xl">
          <p>{dateStr.split("-")[2]}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center p-3 pb-36 pt-10">
      <PageTitle text={`Historical Daily Albums for ${monthName} ${year}`} />
      <div className="flex justify-between w-4/5">
        <Button 
          as={Link}
          href={`/dashboard/spotify/calendar/${lastMonth.getFullYear()}/${padNumber(Number(lastMonth.getMonth()))}`}
          radius="lg"
          className={`w-fit hover:underline text-white bg-gradient-to-br from-green-700/80 to-green-800/80`}
          variant="solid"
        >
          <b>Previous Month</b>
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
          className={`${(currMonth) ? "invisible" : ""} w-fit hover:underline text-white bg-gradient-to-br from-green-700/80 to-green-800/80`}
          variant="solid"
        >
          <b>Next Month</b>
        </Button>
      </div>
      <table className="w-4/5 h-full table-fixed mx-auto border-separate border-spacing-1">
        <thead>
          <tr>
            <th className="rounded-2xl bg-zinc-800/50 font-extralight py-2">Sunday</th>
            <th className="rounded-2xl bg-zinc-800/50 font-extralight py-2">Monday</th>
            <th className="rounded-2xl bg-zinc-800/50 font-extralight py-2">Tuesday</th>
            <th className="rounded-2xl bg-zinc-800/50 font-extralight py-2">Wednesday</th>
            <th className="rounded-2xl bg-zinc-800/50 font-extralight py-2">Tursday</th>
            <th className="rounded-2xl bg-zinc-800/50 font-extralight py-2">Friday</th>
            <th className="rounded-2xl bg-zinc-800/50 font-extralight py-2">Saturday</th>
          </tr>
        </thead>
        <tbody>
          {genCalendar()}
        </tbody>
      </table>
    </div>
  )
}