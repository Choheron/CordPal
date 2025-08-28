import { getAOtDByMonth } from "@/app/lib/aotd_utils";
import { monthToWeekArray } from "@/app/lib/calendar_utils";
import { daysInMonth, monthToName, padNumber } from "@/app/lib/utils"
import MinimalAlbumDisplay from "@/app/ui/dashboard/aotd/minimal_album_display";
import PageTitle from "@/app/ui/dashboard/page_title";
import { Button } from "@heroui/react";
import Link from "next/link";


export default async function Page({
  params,
}: {
  params: Promise<{ year: string }> 
}) {
  type Month = {
    month: string;
    month_number: number;
    day_count: number;
    aotd_data: object;
    week_data: Array<Array<string>>[];
  }
  // Parse year from URL
  const { year } = (await params)
  // Create new Date object
  const yearDate = new Date(year)
  // Get Today's Date
  const today = new Date()
  // Generate an object to contain year data
  let yearData: Month[] = Array(12)
  for(var i = 0; i < yearData.length; i++) {
    yearData[i] = {
      month: monthToName(i + 1),
      month_number: i+1,
      day_count: daysInMonth(year, i+1),
      aotd_data: await getAOtDByMonth(year, padNumber(Number(i+1))),
      week_data: monthToWeekArray(year, i+1, daysInMonth(year, i+1))
    }
  }


  // Helper function to generate a single month's data
  const genMonth = (month: Month) => {
    // Helper function to generate the UI For a day
    const genDay = (date_str) => {
      const day_data = month.aotd_data[date_str]
      const dateArr = date_str.split("-")
      // Helper func to get data about this album
      function albumGet(field) {
        if(day_data) {
          return day_data[field]
        }
        return null
      }
      // If day is from previous month, return nothing
      if (date_str.split("-")[1] != padNumber(month.month_number)) {
        return <></>
      // If date is in the future, do special actions
      } else if (new Date(Number(dateArr[0]), Number(dateArr[1]) - 1, Number(dateArr[2])) > today) {
        return (
          <div className="relative bg-neutral-800 rounded-2xl h-fit">
            <div className="p-[2px] w-fit text-center bg-zinc-900/90 border border-zinc-900 rounded-t-2xl rounded-br-2xl text-[8px] 3xl:text-[15px]">
              <p>{dateArr[2]}</p>
            </div>
            <div className="relative object-scale-down">
              {/* Album Body */}
              <MinimalAlbumDisplay
                showAlbumRating={true}
                title={"Future Album"}
                album_img_src={`https://www.placemonkeys.com/500?greyscale&random=${dateArr[2]}`}
                artist={{'name': "Monke"}}
                sizingOverride="w-full h-full aspect-square"
                albumCoverOverride="rounded-b-2xl"
              />
            </div>
          </div>
        )
      // Handling of normal date
      } else {
        return (
          <div className="relative bg-neutral-800 rounded-2xl h-fit">
            <div className="p-[2px] w-fit text-center bg-zinc-900/90 border border-zinc-900 rounded-t-2xl rounded-br-2xl text-[8px] 3xl:text-[15px]">
              <p>{dateArr[2]}</p>
            </div>
            <div className="relative object-scale-down">
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
                sizingOverride="w-full h-full aspect-square"
                albumCoverOverride="rounded-b-2xl"
                buttonUrlOverride={`/dashboard/aotd/calendar/${year}/${month.month_number}/${padNumber(dateArr[2])}`}
                titleTextOverride="text-center text-xl 2xl:text-2xl text-wrap line-clamp-2"
                artistTextOverride="text-center text-sm 2xl:text-xl italic text-wrap"
                starTextOverride="text-base 2xl:text-2xl"
              />
            </div>
          </div>
        )
      }
    }

    // Final Return for the whole Month
    return (
      <table className="w-full h-full table-fixed mx-auto sm:border-separate">
        <thead>
          <tr>
            <th className="rounded-2xl bg-zinc-800/50 font-extralight py-2 text-sm truncate">Su</th>
            <th className="rounded-2xl bg-zinc-800/50 font-extralight py-2 text-sm truncate">Mo</th>
            <th className="rounded-2xl bg-zinc-800/50 font-extralight py-2 text-sm truncate">Tu</th>
            <th className="rounded-2xl bg-zinc-800/50 font-extralight py-2 text-sm truncate">We</th>
            <th className="rounded-2xl bg-zinc-800/50 font-extralight py-2 text-sm truncate">Th</th>
            <th className="rounded-2xl bg-zinc-800/50 font-extralight py-2 text-sm truncate">Fr</th>
            <th className="rounded-2xl bg-zinc-800/50 font-extralight py-2 text-sm truncate">Sa</th>
          </tr>
        </thead>
        <tbody>
          {
            month.week_data.map((week, wi) => {
              return (
                <tr key={wi} >
                  {week.map((day, di) => {
                    return (
                      <td 
                        key={di}
                        className="w-[14.2857%] align-top"  
                      >
                        {genDay(day)}
                      </td>
                    )
                  })}
                </tr>
              )
            })
          }
        </tbody>
      </table>
    )
  }


  return(
    <div className="w-full">
      <PageTitle text={`Historical Daily Albums for ${year}`} />
      <div className="flex flex-col sm:flex-row flex-wrap">
        {yearData.map((obj, index) => {
          return (
            <div className="w-full sm:w-1/3 3xl:w-1/4 px-2 py-4" key={index}>
              <Button 
                as={Link}
                href={`/dashboard/aotd/calendar/${year}/${obj.month_number}`}
                radius="lg"
                className={`w-full hover:underline text-white bg-gradient-to-br from-green-700/80 to-green-800/80`}
                variant="solid"
              >
                <p>{obj.month}</p>
              </Button>
              <div>
                {genMonth(obj)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}