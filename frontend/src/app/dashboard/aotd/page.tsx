'use server'

import Link from "next/link";

import PageTitle from "@/app/ui/dashboard/page_title";
import { Conditional } from "@/app/ui/dashboard/conditional";
import SpotifyLoginBox from "@/app/ui/dashboard/aotd/aotd_enroll_box";
import { getAlbumOfTheDayData, getLastXSubmissions, isAotdParticipant } from "@/app/lib/aotd_utils";
import AlbumOfTheDayBox from "@/app/ui/dashboard/aotd/album_of_the_day";
import RecentSubmissions from "@/app/ui/dashboard/aotd/recent_submissions";
import MusicStatsBox from "@/app/ui/dashboard/aotd/statistics_displays/music_stats_box";
import { Button } from "@heroui/button";
import { getLastYearInTimezone, padNumber } from "@/app/lib/utils";
import MinimalAlbumDisplay from "@/app/ui/dashboard/aotd/minimal_album_display";

export default async function music() {
  const aotd_participant = await isAotdParticipant();
  const recentSubmissionsResponse = await getLastXSubmissions(8);

  // Query for last year's AOTD Data
  const last_year_string = getLastYearInTimezone("America/Chicago")
  const last_year_arr = last_year_string.split("-")
  const last_year_aotd = await getAlbumOfTheDayData(last_year_string)
  const last_year_has_aotd = (last_year_aotd['album_id'] != null)

  return (
    <div className="flex flex-col items-center p-3 pb-36 pt-10">
      <PageTitle text="Album Of The Day" />
      <Conditional showWhen={!aotd_participant}>
        <SpotifyLoginBox />
      </Conditional>
      <Conditional showWhen={aotd_participant}>
        <div className="w-full 2xl:w-3/5 ">
          <div className="flex flex-col w-full justify-center xl:flex-row gap-2">
            {/* Left side Album of The Day Display */}
            <AlbumOfTheDayBox />
            {/* Right side prev year and recent submissions display*/}
            <div className="max-w-full lg:max-w-[350px] flex flex-col">
              {/* Display the album from a year ago today if it exists */}
              <Conditional showWhen={last_year_has_aotd}>
                <div className="h-fit p-3 rounded-2xl bg-zinc-800/30 border border-neutral-800 mt-2">
                  <p className='text-xl mx-auto font-extralight w-fit'>Last Year Today:</p>
                  <MinimalAlbumDisplay 
                    showSubmitInfo={last_year_aotd["submitter"] != null}
                    showAlbumRating={true}
                    ratingOverride={last_year_aotd["rating"]}
                    title={last_year_aotd["title"]}
                    album_mbid={last_year_aotd["album_id"]}
                    album_img_src={`/dashboard/aotd/api/album-cover/${last_year_aotd["album_id"]}`}
                    album_src={last_year_aotd["album_src"]}
                    artist={last_year_aotd["artist"]}
                    submitter={last_year_aotd["submitter"]}
                    submitter_comment={last_year_aotd["submitter_comment"]}
                    submission_date={last_year_aotd["submission_date"]}
                    historical_date={last_year_aotd['date']}
                    sizingOverride="w-full h-full"
                    albumCoverOverride="rounded-2xl"
                    buttonUrlOverride={`/dashboard/aotd/calendar/${last_year_arr[0]}/${last_year_arr[1]}/${padNumber(last_year_arr[2])}`}
                    titleTextOverride="text-center text-xl 2xl:text-2xl text-wrap line-clamp-2"
                    artistTextOverride="text-center text-sm 2xl:text-xl italic text-wrap"
                    starTextOverride="text-base 2xl:text-2xl"
                  />
                </div>
              </Conditional>
              <div className={`h-full mb-2 ${(last_year_has_aotd) ? "md:max-h-[450px]" : ""}`}>
                <RecentSubmissions 
                  albumList={recentSubmissionsResponse['album_list']} 
                  timestamp={recentSubmissionsResponse['timestamp']}
                />
              </div>
              <Link
                href={"/dashboard/aotd/album/all"}
                prefetch={false}
                className="flex"
              >
                <Button
                  className="p-2 mx-auto my-2 w-[90%] text-sm text-inheret h-fit bg-gradient-to-br from-green-700/80 to-green-800/80 hover:underline"
                  size="sm"
                  radius="lg"
                  variant="solid"
                >
                  <b>View All Albums</b>
                </Button>
              </Link>
            </div>
          </div>
          <MusicStatsBox />
        </div>
      </Conditional>
    </div>
  );
}