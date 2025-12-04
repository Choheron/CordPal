'use server'

import PageTitle from "@/app/ui/dashboard/page_title";
import { Conditional } from "@/app/ui/dashboard/conditional";
import SpotifyLoginBox from "@/app/ui/dashboard/aotd/aotd_enroll_box";
import { getAotdData, getLastXSubmissions, isAotdParticipant } from "@/app/lib/aotd_utils";
import AlbumOfTheDayBox from "@/app/ui/dashboard/aotd/album_of_the_day";
import RecentSubmissions from "@/app/ui/dashboard/aotd/recent_submissions";
import MusicStatsBox from "@/app/ui/dashboard/aotd/statistics_displays/music_stats_box";
import { Alert, Button } from "@heroui/react";
import Link from "next/link";

export default async function music() {
  const aotd_participant = await isAotdParticipant();
  const recentSubmissionsResponse = await getLastXSubmissions(8);

  return (
    <div className="flex flex-col items-center p-3 pb-36 pt-10">
      <PageTitle text="Album Of The Day" />
      <Conditional showWhen={!aotd_participant}>
        <SpotifyLoginBox />
      </Conditional>
      <Conditional showWhen={aotd_participant}>
        <div className="w-full 2xl:w-3/5 ">
          <div className="flex flex-col w-full justify-center xl:flex-row gap-2">
            <AlbumOfTheDayBox title={"Album Of The Day"} />
            <div className="w-full max-w-full lg:max-w-[350px] flex flex-col">
              <RecentSubmissions 
                albumList={recentSubmissionsResponse['album_list']} 
                timestamp={recentSubmissionsResponse['timestamp']}
              />
              <Button
                as={Link}
                href={"/dashboard/aotd/album/all"}
                prefetch={false}
                className="p-2 mx-auto my-2 w-[90%] text-sm text-inheret h-fit bg-gradient-to-br from-green-700/80 to-green-800/80 hover:underline"
                size="sm"
                radius="lg"
                variant="solid"
              >
                <b>View All Albums</b>
              </Button>
            </div>
          </div>
          <MusicStatsBox />
        </div>
      </Conditional>
    </div>
  );
}