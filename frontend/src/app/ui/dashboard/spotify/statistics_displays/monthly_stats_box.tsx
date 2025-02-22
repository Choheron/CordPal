import { monthToName, padNumber, ratingToTailwindBgColor } from "@/app/lib/utils";
import MinimalAlbumDisplay from "../minimal_album_display";
import { Badge, Divider, Tooltip } from "@nextui-org/react";
import UserCard from "@/app/ui/general/userUiItems/user_card";
import { RiQuestionMark } from "react-icons/ri";



// Display monthy statistics for the AOtD
// Expected Props:
//  - atodData: Object - AOTD data for the month
//  - subData: Object - Submission data for the month
export default function MonthlyStatsBox(props) {
  // Prop validation
  const aotdData = (props.aotdData) ? props.aotdData : null;
  const subData = (props.subData) ? props.subData : null;
  const aotdStats = (aotdData) ? aotdData['stats'] : null;
  const year = (props.year) ? props.year : null;
  const month = (props.month) ? props.month : null;
  // Data Parsing from props
  const highest_album = (aotdStats) ? aotdData[aotdStats['highest_aotd_date']] : "Not Found";
  const lowest_album = (aotdStats) ? aotdData[aotdStats['lowest_aotd_date']] : "Not Found";
  const selection_counts = (aotdStats) ? aotdStats['selection_counts'] : "Not Found";


  // Display lowest and highest album of the month, with their ratings
  const lowestHighestAlbum = () => {
    const highestAlbumDateArr = aotdStats['highest_aotd_date'].split("-")
    const lowestAlbumDateArr = aotdStats['lowest_aotd_date'].split("-")

    return (
      <div className="w-full lg:w-[400px] flex flex-col backdrop-blur-2xl pl-2 pr-4 py-2 my-2 rounded-2xl bg-zinc-800/30 border border-neutral-800">
        {/* Highest Album */}
        <p className="font-extralight w-full text-center text-xl underline">
          Highest:
        </p>
        <Badge
          content={highest_album['rating'].toFixed(2)} 
          size="lg" 
          placement="top-right" 
          shape="rectangle"
          showOutline={false}
          variant="shadow"
          className={`-mt-1  ${ratingToTailwindBgColor(highest_album["rating"].toFixed(2))} lg:text-xl text-black`}
        >
          <div className="relative w-full h-full p-1">
            <MinimalAlbumDisplay
              showSubmitInfo
              showAlbumRating={true}
              ratingOverride={highest_album["rating"]}
              title={highest_album["title"]}
              album_spotify_id={highest_album["album_id"]}
              album_img_src={highest_album["album_img_src"]}
              album_src={highest_album["spotify_url"]}
              artist={highest_album["artist"]}
              submitter={highest_album["submitter"]}
              submitter_comment={highest_album["submitter_comment"]}
              submission_date={highest_album["submission_date"]}
              historical_date={highest_album['date']}
              sizingOverride="w-full h-full"
              buttonUrlOverride={`/dashboard/spotify/calendar/${year}/${month}/${highestAlbumDateArr[2]}`}
              titleTextOverride="text-center text-xl 2xl:text-2xl text-wrap line-clamp-2"
              artistTextOverride="text-center text-sm 2xl:text-xl italic text-wrap"
              starTextOverride="text-base 2xl:text-3xl"
            />
            <div className="absolute left-1 bg-zinc-800/90 border border-neutral-800 top-0 p-2 rounded-tl-2xl rounded-br-2xl">
              <p>{highestAlbumDateArr[2]}</p>
            </div>
          </div>
        </Badge>
        {/* Lowest Album */}
        <p className="font-extralight w-full text-center text-xl underline">
          Lowest:
        </p>
        <Badge
          content={lowest_album['rating'].toFixed(2)} 
          size="lg" 
          placement="top-right" 
          shape="rectangle"
          showOutline={false}
          variant="shadow"
          className={`-mt-1 ${ratingToTailwindBgColor(lowest_album["rating"].toFixed(2))} lg:text-xl text-black`}
        >
          <div className="relative w-full h-full p-1">
            <MinimalAlbumDisplay
              showSubmitInfo
              showAlbumRating={true}
              ratingOverride={lowest_album["rating"]}
              title={lowest_album["title"]}
              album_spotify_id={lowest_album["album_id"]}
              album_img_src={lowest_album["album_img_src"]}
              album_src={lowest_album["spotify_url"]}
              artist={lowest_album["artist"]}
              submitter={lowest_album["submitter"]}
              submitter_comment={lowest_album["submitter_comment"]}
              submission_date={lowest_album["submission_date"]}
              historical_date={lowest_album['date']}
              sizingOverride="w-full h-full"
              buttonUrlOverride={`/dashboard/spotify/calendar/${year}/${month}/${lowestAlbumDateArr[2]}`}
              titleTextOverride="text-center text-xl 2xl:text-2xl text-wrap line-clamp-2"
              artistTextOverride="text-center text-sm 2xl:text-xl italic text-wrap"
              starTextOverride="text-base 2xl:text-3xl"
            />
            <div className="absolute left-1 bg-zinc-800/90 border border-neutral-800 top-0 p-2 rounded-tl-2xl rounded-br-2xl">
              <p>{lowestAlbumDateArr[2]}</p>
            </div>
          </div>
        </Badge>
      </div>
    )
  }

  // Display counts of user albums being selected
  const selectionCounts = () => {
    return (
      <div className="relative w-full lg:w-[300px] flex flex-col backdrop-blur-2xl pl-2 pr-4 py-2 my-2 rounded-2xl bg-zinc-800/30 border border-neutral-800">
        <p className="font-extralight w-full text-center text-xl underline mb-1">
          Number Selected:
        </p>
        <div className="flex justify-between w-full px-3 font-extralight">
          <p>Total Selected:</p>
          <p>{aotdStats['selection_total']}</p>
        </div>
        <Divider />
        <div className="flex flex-col h-full">
          {selection_counts.sort((a, b) => ((a["count"] < b["count"]) ? 1 : -1)).map((user, index) => {
            return (
              <div 
                key={`${user['discord_id']}-${user['count']}`}
                className="flex justify-between w-full my-1 px-3"
              >
                <UserCard 
                  isProfileLink
                  userDiscordID={user['discord_id']}
                  customDescription={(
                    <p>{Number(user['percentage']).toFixed(2)}%</p>
                  )}
                />
                <p className="my-auto px-2 py-1 bg-gray-800 rounded-full">
                  {user['count']}
                </p>
              </div>
            )
          })}
        </div>
        {/* Top Left Tooltip */}
        <Tooltip content={`Breakdown of number of selected albums, by submitter, for ${monthToName(month)} ${year}.`} >
          <div className="absolute top-0 left-0 p-1 border-b border-r border-neutral-800 rounded-br-2xl rounded-tl-2xl bg-zinc-800/30 text-blue-800">
            <RiQuestionMark className="text-xl" />
          </div>
        </Tooltip>
      </div>
    )
  }

  // Display counts of album submissions
  const submissionCount = () => {
    const submission_counts = subData['submission_counts']
    const submission_total = subData['submission_total']

    return (
      <div className="w-full lg:w-[300px] flex flex-col backdrop-blur-2xl pl-2 pr-4 py-2 my-2 rounded-2xl bg-zinc-800/30 border border-neutral-800">
        <p className="font-extralight w-full text-center text-xl underline mb-1">
          Submission Counts:
        </p>
        <div className="flex justify-between w-full px-3 font-extralight">
          <p>Total Submitted:</p>
          <p>{submission_total}</p>
        </div>
        <Divider />
        <div className="flex flex-col h-full">
          {submission_counts.sort((a, b) => ((a["count"] < b["count"]) ? 1 : -1)).map((user, index) => {
            return (
              <div 
                key={`${user['discord_id']}-${user['count']}`}
                className="flex justify-between w-full my-1 px-3"
              >
                <UserCard 
                  isProfileLink
                  userDiscordID={user['discord_id']}
                  customDescription={(
                    <p>{Number(user['percentage']).toFixed(2)}%</p>
                  )}
                />
                <p className="my-auto px-2 py-1 bg-gray-800 rounded-full">
                  {user['count']}
                </p>
              </div>
            )
          })}
        </div>
        {/* Top Left Tooltip */}
        <Tooltip content={`Breakdown of number of albums submitted, by user, for ${monthToName(month)} ${year}`} >
          <div className="absolute top-0 left-0 p-1 border-b border-r border-neutral-800 rounded-br-2xl rounded-tl-2xl bg-zinc-800/30 text-blue-800">
            <RiQuestionMark className="text-xl" />
          </div>
        </Tooltip>
      </div>
    )
  }


  return (
    <div className="w-full flex flex-col lg:flex-row gap-2">
      {/* Lowest and Highest Album of the Month */}
      {lowestHighestAlbum()}
      {/* Selection Breakdown */}
      {selectionCounts()}
      {/* Submission Breakdown */}
      {submissionCount()}
    </div>
  )
}