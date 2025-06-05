"use server"

import { ratingToTailwindBgColor } from "@/app/lib/utils";
import CustomPercentageDisplay from "@/app/ui/general/charts/custom_percentage_display";
import { RosenBarChartHorizontal } from "@/app/ui/general/charts/rosen_barchart_horizontal";
import StarRating from "@/app/ui/general/star_rating";
import UserCard from "@/app/ui/general/userUiItems/user_card";
import { Divider, Tooltip } from "@heroui/react";
import { RiQuestionMark } from "react-icons/ri";


// Display the review stats for a month, should only be called with the following props (to properly work)
// Expected Props:
//  - reviewData: Obj - Object containing review data for that month
//  - year: String - Year of month
//  - monthName: String - Human readable month name
export default async function MonthlyReviewStats(props) {
  // Get data from props
  const reviewData = (props.reviewData) ? props.reviewData : null;
  const year = (props.year) ? props.year : null;
  const monthName = (props.monthName) ? props.monthName : null;
  // Extract data from props
  const biggest_lover_id = reviewData['biggest_lover_id']
  const biggest_hater_id = reviewData['biggest_hater_id']
  const user_stats = reviewData['user_stats']
  const score_stats = reviewData['score_stats']
  const total_reviews = reviewData['total_reviews']
  const review_average = reviewData['all_review_average']
  // Tailwind
  const starSize="text-base"
  const biggestXBoxShared = "w-full text-center border border-zinc-800 rounded-xl p-2 bg-slate-400/10"
  // Map score breakdown to percentage bar list
  const score_breakdown_percentages_list = reviewData['score_stats'].map((scoreObj, index) => {
    return(
      {
        "key_label": "Score",
        "key": scoreObj['score'],
        "percent": `${scoreObj['percent'].toFixed(2)}%`,
        "value": scoreObj['count'],
        "color": ratingToTailwindBgColor(scoreObj['score'])
      }
  )})
  

  // If No review data is in, return an empty box with a warning 
  if(reviewData['total_reviews'] == 0) {
    return (
      <div className="w-full md:w-[300px] lg:w-[400px] flex flex-col backdrop-blur-2xl pl-2 pr-4 py-2 my-2 rounded-2xl bg-zinc-800/30 border border-neutral-800">
        <div className="max-w-full mx-auto px-2 py-2 my-auto text-small text-center italic border border-neutral-800 rounded-2xl bg-zinc-800/30">
          <p>No review data for {monthName} {year}</p>
        </div>
      </div>
    )
  }
  // Otherwise do normal data display
  return (
    <div className="w-full lg:w-[475px] flex flex-col backdrop-blur-2xl px-2 py-2 my-2 rounded-2xl bg-zinc-800/30 border border-neutral-800 font-extralight">
      <p className="w-full text-center text-xl mb-1">
        Month Review Stats:
      </p>
      <Divider className="mb-1" />
      {/* Biggest Lover and Biggest Hater */}
      <div className="max-w-full mx-auto px-2 py-2 my-2 text-small text-center italic border border-neutral-800 rounded-2xl bg-zinc-800/30">
        <p>To be considered for Biggest Lover/Hater, a user must have submitted reviews for at least a third of the albums in {monthName} {year}</p>
      </div>
      <div className="flex flex-col lg:flex-row w-full justify-between gap-2">
        {/* Biggest Lover Box */}
        <div className={`${biggestXBoxShared}`}>
          <p>Biggest Lover:</p>
          <Divider className="mb-1" />
          <UserCard
            isProfileLink
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
            isProfileLink
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
        {/* Score Breakdown */}
        <p>Review Scores/Percentages Chart:</p>
        <RosenBarChartHorizontal data={score_breakdown_percentages_list} />
      </div>
      {/* Top Left Tooltip */}
      <Tooltip content={`Month review stats for ${monthName} ${year}.`} >
        <div className="absolute top-0 left-0 p-1 border-b border-r border-neutral-800 rounded-br-2xl rounded-tl-2xl bg-zinc-800/30 text-blue-800">
          <RiQuestionMark className="text-xl" />
        </div>
      </Tooltip>
    </div>
  )
}