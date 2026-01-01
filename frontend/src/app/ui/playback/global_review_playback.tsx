"use server"

import BasicTable from "./tables/basic_table"
import UserCard from "../general/userUiItems/user_card"
import BasicPieChart from "./graphs/basic_pie_chart"
import PlaybackAward from "./graphics/playback_award"
import { ratingToTailwindBgColor } from "@/app/lib/utils"

export default async function GlobalReviewPlayback(props) {
  const reviewStats = props['reviewPlaybackData']

  const backgroundGradientTQ = "bg-gradient-to-bl from-slate-900 to-slate-950"

  const reviewColumn = () => {
    const rows = reviewStats['total_reviews_leaderboard'].map((data, index) => {
      return {
        key: index,
        position: index + 1,
        userdiscordid: (
          <UserCard userDiscordID={data['user__discord_id']} isProfileLink={true}/>
        ),
        userid: data['user__discord_id'],
        percentage: `${((parseFloat(data['total_reviews'])/parseFloat(reviewStats['total_reviews'])) * 100).toFixed(2)}%`,
        count: data['total_reviews'],
        streak: `🔥 ${data['longest_review_streak']}`
      }
    })
    const columns = [
      {
        key: "position",
        label: "#"
      },
      {
        key: "userdiscordid",
        label: "USER",
      },
      {
        key: "percentage",
        label: "PERCENTAGE",
      },
      {
        key: "count",
        label: "REVIEW COUNT",
      },
      {
        key: "streak",
        label: "LONGEST STREAK",
      },
    ];

    return (
      <>
        <BasicPieChart chartData={rows} title_text={`Total Reviews: ${reviewStats['total_reviews']}`} tooltip_text="Breakdown of submitted Reviews, by user."/>
        <BasicTable columns={columns} rows={rows} table_label="Review Leaderboard Table" />
        <div className="max-w-[100vw] flex justify-around gap-1 pt-1">
          {/* Most Review Edits */}
          <PlaybackAward 
            title="The Thinker"
            userId={reviewStats['most_review_edits']['review__user__discord_id']} 
            flavor_text="Are you sure?"
            emoji="🖋️"
            showNickname
            stat_text={
              <div className="flex gap-1">
                <p>Review Edits Made:</p>
                <p className={`font-bold`}>
                  {reviewStats['most_review_edits']['total_edits']}
                </p>
              </div>
            }
          />
          {/* Least Review Edits */}
          <PlaybackAward 
            title="Set In Stone"
            userId={reviewStats['least_review_edits']['review__user__discord_id']} 
            flavor_text="I'm not saying it again"
            emoji="🗿"
            showNickname
            stat_text={
              <div className="flex gap-1">
                <p>Review Edits Made:</p>
                <p className={`font-bold`}>
                  {reviewStats['least_review_edits']['total_edits']}
                </p>
              </div>
            }
          />
        </div>
      </>
    )
  }

  const averageRatingColumn = () => {
    const rows = reviewStats['average_rating_leaderboard'].map((data, index) => {
      return {
        key: index,
        position: index + 1,
        userdiscordid: (
          <UserCard userDiscordID={data['user__discord_id']} isProfileLink={true}/>
        ),
        userid: data['user__discord_id'],
        count: data['average_score_given'].toFixed(3)
      }
    })
    const columns = [
      {
        key: "position",
        label: "#"
      },
      {
        key: "userdiscordid",
        label: "USER",
      },
      {
        key: "count",
        label: "AVG SCORE GIVEN",
      },
    ];

    return (
      <div>
        <div className="max-w-[100vw] flex gap-1 pt-1">
          {/* Biggest Lover */}
          <PlaybackAward 
            title="Biggest Lover"
            userId={reviewStats['highest_average']['user__discord_id']} 
            flavor_text="I just think they're neat"
            emoji="❤️"
            showNickname
            stat_text={
              <div className="flex gap-1">
                <p>Average Score:</p>
                <p className={`${ratingToTailwindBgColor(reviewStats['highest_average']['average_score_given'])} text-black px-1 rounded-lg font-bold`}>
                  {reviewStats['highest_average']['average_score_given'].toFixed(4)}
                </p>
              </div>
            }
          />
          {/* Biggest Hater */}
          <PlaybackAward 
            title="Biggest Hater"
            userId={reviewStats['lowest_average']['user__discord_id']} 
            flavor_text="This shit ass"
            emoji="💔"
            showNickname
            stat_text={
              <div className="flex gap-1">
                <p>Average Score:</p>
                <p className={`${ratingToTailwindBgColor(reviewStats['lowest_average']['average_score_given'])} text-black px-1 rounded-lg font-bold`}>
                  {reviewStats['lowest_average']['average_score_given'].toFixed(4)}
                </p>
              </div>
            }
          />
        </div>
        <p className="mx-auto text-lg">Average Review Score Leaderboard:</p>
        <BasicTable columns={columns} rows={rows} table_label="Average Review Score Given Leaderboard Table" />
      </div>
    )
  }

  const stddevColumn = () => {
    const rows = reviewStats['stddev_leaderboard'].map((data, index) => {
      return {
        key: index,
        position: index + 1,
        userdiscordid: (
          <UserCard userDiscordID={data['user__discord_id']} isProfileLink={true}/>
        ),
        userid: data['user__discord_id'],
        count: data['review_score_std'].toFixed(3)
      }
    })
    const columns = [
      {
        key: "position",
        label: "#"
      },
      {
        key: "userdiscordid",
        label: "USER",
      },
      {
        key: "count",
        label: "SCORE STD DEV",
      },
    ];

    return (
      <div>
        <p className="mx-auto text-lg">Standard Deviation Leaderboard:</p>
        <BasicTable columns={columns} rows={rows} table_label="Standard Deviation Leaderboard Table" />
        <div className="max-w-[100vw] flex gap-1 pt-1">
          {/* Mr. Opinionated */}
          <PlaybackAward 
            title="Mr. Opinionated"
            userId={reviewStats['highest_stddev']['user__discord_id']} 
            flavor_text="Highest Standard Deviation"
            emoji="🎭"
            showNickname
            stat_text={
              <div className="flex gap-1">
                <p>Standard Deviation:</p>
                <p className={`font-bold`}>
                  {reviewStats['highest_stddev']['review_score_std'].toFixed(4)}
                </p>
              </div>
            }
          />
          {/* Ol' Reliable */}
          <PlaybackAward 
            title={`Ol' Reliable`}
            userId={reviewStats['lowest_stddev']['user__discord_id']} 
            flavor_text="Lowest Standard Deviation"
            emoji="🎯"
            showNickname
            stat_text={
              <div className="flex gap-1">
                <p>Standard Deviation:</p>
                <p className={`font-bold`}>
                  {reviewStats['lowest_stddev']['review_score_std'].toFixed(4)}
                </p>
              </div>
            }
          />
        </div>
      </div>
    )
  }


  return (
    <div className="w-fit mx-auto p-2 flex flex-col sm:flex-row">
      {/* Leaderboards */}
      <div className="flex flex-col sm:flex-row max-h-[100vh] rounded-2xl p-2 gap-3 items-center">
        {/* Reviews Left Leaderboards */}
        <div className="flex flex-col max-h-[93%]">
          {reviewColumn()}
        </div>
        {/* Avg Rating Leaderboards */}
        <div className="flex flex-col max-h-[93%]">
          {averageRatingColumn()}
        </div>
        {/* Standard Deviations Leaderboards */}
        <div className="flex flex-col max-h-[93%]">
          {stddevColumn()}
        </div>
      </div>
    </div>
  )
}