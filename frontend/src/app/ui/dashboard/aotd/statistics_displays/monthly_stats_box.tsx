"use server"

import { monthToName, padNumber } from "@/app/lib/utils";
import MonthlyLowestHighestAlbum from "./monthly/monthly_lowest_highest_album";
import MonthlyReviewStats from "./monthly/monthly_review_stats";
import MonthlySelectionCountsPie from "./monthly/monthly_selection_counts_pie";
import MonthlySubmissionCountsPie from "./monthly/monthly_submission_counts_pie";
import MonthlyUserStats from "./monthly/monthly_user_stats";
import UserCard from "@/app/ui/general/userUiItems/user_card";
import { getAllAotdUsersList, getAOtDByMonth, getReviewStatsByMonth, getSubmissionsByMonth } from "@/app/lib/aotd_utils";

// Display monthy statistics for the AOtD
// Expected Props:
//  - atodData: Object - AOTD data for the month
//  - subData: Object - Submission data for the month
//  - reviewData: Object - Review data for the month
//  - spotifyUserData: Object - Data for all users who have authenticated with spotify
export default async function MonthlyStatsBox(props) {
  // Prop validation/fetching data from backend
  const year = (props.year) ? props.year : null;
  const month = (props.month) ? props.month : null;
  const aotdData = (props.aotdData) ? props.aotdData : (await getAOtDByMonth(year, padNumber(Number(month))));
  const subData = (props.subData) ? props.subData : (await getSubmissionsByMonth(year, padNumber(Number(month))));
  const reviewData = (props.reviewData) ? props.reviewData : (await getReviewStatsByMonth(year, padNumber(Number(month))));
  const spotifyUserData = (props.spotifyUserData) ? props.spotifyUserData : (await getAllAotdUsersList())
  const aotdStats = (aotdData) ? aotdData['stats'] : null;
  // Data Parsing from props
  const highest_album = (aotdStats) ? aotdData[aotdStats['highest_aotd_date']] : "Not Found";
  const lowest_album = (aotdStats) ? aotdData[aotdStats['lowest_aotd_date']] : "Not Found";
  const month_name = monthToName(month)

  return (
    <>
      <div className="w-full flex flex-row flex-wrap justify-center gap-2">
        {/* Lowest and Highest Album of the Month */}
        <MonthlyLowestHighestAlbum 
          aotdStats={aotdStats}
          reviewData={reviewData}
          year={year}
          month={month}
          monthName={month_name}
          highestAlbum={highest_album}
          lowestAlbum={lowest_album}
        />
        <div className="flex flex-col w-full lg:w-fit justify-between">
          {/* Selection Breakdown */}
          <MonthlySelectionCountsPie 
            aotdStats={aotdStats}
            monthName={month_name}
            year={year}
          />
          {/* Submission Breakdown */}
          <MonthlySubmissionCountsPie 
            subData={subData}
            monthName={month_name}
            year={year}
          />
        </div>
        {/* Review stats for the Month - NOTE: Only show when reviews have been created for this month*/}
        <MonthlyReviewStats 
          reviewData={reviewData}
          monthName={month_name}
          year={year}
        />
      </div>
      {/* User specific Stats */}
      <MonthlyUserStats 
        spotifyUserData={spotifyUserData}
        monthName={month_name}
        month={month}
        year={year}
        reviewData={reviewData}
        subData={subData}
        aotdData={aotdData}
      />
  </>
  )
}