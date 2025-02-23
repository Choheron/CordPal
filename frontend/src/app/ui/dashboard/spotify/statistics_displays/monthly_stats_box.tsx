import { monthToName, padNumber, ratingToTailwindBgColor } from "@/app/lib/utils";
import MinimalAlbumDisplay from "../minimal_album_display";
import { Badge, Divider, Tooltip, User } from "@nextui-org/react";
import UserCard from "@/app/ui/general/userUiItems/user_card";
import { RiQuestionMark } from "react-icons/ri";
import StarRating from "@/app/ui/general/star_rating";
import CustomPercentageDisplay from "@/app/ui/general/charts/custom_percentage_display";

// Display monthy statistics for the AOtD
// Expected Props:
//  - atodData: Object - AOTD data for the month
//  - subData: Object - Submission data for the month
//  - reviewData: Object - Review data for the month
export default function MonthlyStatsBox(props) {
  // Prop validation
  const aotdData = (props.aotdData) ? props.aotdData : null;
  const subData = (props.subData) ? props.subData : null;
  const reviewData = (props.reviewData) ? props.reviewData : null;
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
      <div className="w-full md:w-[300px] lg:w-[400px] flex flex-col backdrop-blur-2xl pl-2 pr-4 py-2 my-2 rounded-2xl bg-zinc-800/30 border border-neutral-800">
        {/* Highest Album */}
        <p className="font-extralight w-full text-center text-xl">
          Highest:
        </p>
        <Divider className="mb-1" />
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
        <p className="font-extralight w-full text-center text-xl">
          Lowest:
        </p>
        <Divider className="mb-1" />
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
      <div className="relative w-full md:w-[250px] flex flex-col backdrop-blur-2xl pl-2 pr-4 py-2 my-2 rounded-2xl bg-zinc-800/30 border border-neutral-800">
        <p className="font-extralight w-full text-center text-xl mb-1">
          Number Selected:
        </p>
        <Divider />
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
      <div className="w-full md:w-[250px] flex flex-col backdrop-blur-2xl pl-2 pr-4 py-2 my-2 rounded-2xl bg-zinc-800/30 border border-neutral-800">
        <p className="font-extralight w-full text-center text-xl mb-1">
          Submission Counts:
        </p>
        <Divider />
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

  // Display monthly review stats
  const monthReviewStats = () => {
    const biggest_lover_id = reviewData['biggest_lover_id']
    const biggest_hater_id = reviewData['biggest_hater_id']
    const user_stats = reviewData['user_stats']
    const score_stats = reviewData['score_stats']
    const total_reviews = reviewData['total_reviews']
    const review_average = reviewData['all_review_average']
    // Tailwind
    const starSize="text-base"
    const biggestXBoxShared = "w-full text-center border border-zinc-800 rounded-xl p-2 bg-slate-400/10"

    return (
      <div className="w-full md:w-[300px] lg:w-[475px] flex flex-col backdrop-blur-2xl px-2 py-2 my-2 rounded-2xl bg-zinc-800/30 border border-neutral-800 font-extralight">
        <p className="w-full text-center text-xl mb-1">
          Month Review Stats:
        </p>
        <Divider className="mb-1" />
        {/* Biggest Lover and Biggest Hater */}
        <div className="max-w-full mx-auto px-2 py-2 my-2 text-small text-center italic border border-neutral-800 rounded-2xl bg-zinc-800/30">
          <p>To be considered for Biggest Lover/Hater, a user must have submitted reviews for at least a third of the albums in {monthToName(month)} {year}</p>
        </div>
        <div className="flex flex-col lg:flex-row w-full justify-between gap-2">
          {/* Biggest Lover Box */}
          <div className={`${biggestXBoxShared}`}>
            <p>Biggest Lover:</p>
            <Divider className="mb-1" />
            <UserCard
              userDiscordID={biggest_lover_id}
              customDescription={
                <StarRating
                  rating={user_stats[biggest_lover_id]['review_average']}
                  // symbolOverride={<>&#10084;</>}
                  symbolColor="text-yellow-400"
                  textSize={starSize}
                />
              }
            />
            <div className="flex w-full justify-between text-md px-2">
              <p className="my-auto">Average Score:</p>
              <div className={`${ratingToTailwindBgColor(user_stats[biggest_lover_id]['review_average'])} text-black px-2 py-1 rounded-full font-normal`}>
                <p><b>{user_stats[biggest_lover_id]['review_average'].toFixed(2)}</b></p>
              </div>
            </div>
          </div>
          {/* Biggest hater Box */}
          <div  className={`${biggestXBoxShared}`}>
            <p>Biggest Hater:</p>
            <Divider className="mb-1" />
            <UserCard
              userDiscordID={biggest_hater_id}
              customDescription={
                <StarRating
                  rating={user_stats[biggest_hater_id]['review_average']}
                  symbolColor="text-yellow-400"
                  textSize={starSize}
                />
              }
            />
            <div className="flex w-full justify-between text-md px-2">
              <p className="my-auto">Average Score:</p>
              <div className={`${ratingToTailwindBgColor(user_stats[biggest_hater_id]['review_average'])} text-black px-2 py-1 rounded-full font-normal`}>
                <p><b>{user_stats[biggest_hater_id]['review_average'].toFixed(2)}</b></p>
              </div>
            </div>
          </div>
        </div>
        {/* Generic Stats */}
        <div className="w-full px-1 mt-1 mb-2">
          <Divider className="my-1" />
          <div className="flex justify-between w-full mt-1">
            <p className="my-auto">Total Reviews Submitted:</p>
            <p className="my-auto px-4 py-1 bg-gray-800 rounded-full">
              {total_reviews}
            </p>
          </div>
          <Divider className="my-1" />
          <div className="flex justify-between w-full mt-1">
            <p className="my-auto">
              Average Review Score:
            </p>
            <div className="font-normal">
              <p className={`my-auto mx-auto px-2 py-1 mb-1 ${ratingToTailwindBgColor(review_average.toFixed(2))} rounded-full text-black w-fit`}>
                <b>{review_average.toFixed(2)}</b>
              </p>
              <StarRating
                rating={review_average}
                textSize={"text-2xl"}
              />
            </div>
          </div>
          <CustomPercentageDisplay
            title={"Percentage of First Time Listens:"}
            percentage={reviewData['all_first_listen_percentage'].toFixed(2)}
            underColor="bg-green-600"
            underLabel={reviewData['all_first_listen_count']}
            overColor="bg-green-900"
            overLabel={reviewData['total_reviews'] - reviewData['all_first_listen_count']} 
          />
        </div>
        {/* Top Left Tooltip */}
        <Tooltip content={`Month review stats for ${monthToName(month)} ${year}.`} >
          <div className="absolute top-0 left-0 p-1 border-b border-r border-neutral-800 rounded-br-2xl rounded-tl-2xl bg-zinc-800/30 text-blue-800">
            <RiQuestionMark className="text-xl" />
          </div>
        </Tooltip>
      </div>
    )
  }


  return (
    <div className="w-full flex flex-row flex-wrap justify-center gap-2">
      {/* Lowest and Highest Album of the Month */}
      {lowestHighestAlbum()}
      {/* Selection Breakdown */}
      {selectionCounts()}
      {/* Submission Breakdown */}
      {submissionCount()}
      {/* Review stats for the Month */}
      {monthReviewStats()}
    </div>
  )
}