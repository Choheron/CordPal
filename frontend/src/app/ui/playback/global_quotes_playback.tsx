"use server"

import BasicTable from "./tables/basic_table"
import UserCard from "../general/userUiItems/user_card"
import BasicPieChart from "./graphs/basic_pie_chart"
import PlaybackAward from "./graphics/playback_award"

export default async function GlobalQuotesPlayback(props) {
  const quoteStats = props['quotePlaybackData']

  const backgroundGradientTQ = "bg-gradient-to-bl from-slate-900 to-slate-950"

  const quotedColumn = () => {
    const rows = quoteStats['quoted_leaderboards'].map((data, index) => {
      return {
        key: index,
        position: index + 1,
        userdiscordid: (
          <UserCard userDiscordID={data['speaker__discord_id']} isProfileLink={true}/>
        ),
        userid: data['speaker__discord_id'],
        percentage: `${((parseFloat(data['total_quotes'])/parseFloat(quoteStats['total_submitted'])) * 100).toFixed(2)}%`,
        count: data['total_quotes']
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
        label: "TIMES QUOTED",
      },
    ];

    return (
      <div>
        <p className="mx-auto text-lg">Quote Speaker Leaderboard:</p>
        <BasicTable columns={columns} rows={rows} table_label="Photoshop Submissions Leaderboard Table" />
        <BasicPieChart chartData={rows} title_text={`Total Quotes: ${quoteStats['total_submitted']}`} tooltip_text="Breakdown of submitted Quotes, by user."/>
      </div>
    )
  }

  const quotesSubmittedColumn = () => {
    const rows = quoteStats['quote_submission_leaderboards'].map((data, index) => {
      return {
        key: index,
        position: index + 1,
        userdiscordid: (
          <UserCard userDiscordID={data['submitter__discord_id']} isProfileLink={true}/>
        ),
        userid: data['submitter__discord_id'],
        percentage: `${((parseFloat(data['total_submissions'])/parseFloat(quoteStats['total_submitted'])) * 100).toFixed(2)}%`,
        count: data['total_submissions']
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
        label: "QUOTES SUBMITTED",
      },
    ];

    return (
      <div>
        <div className="max-w-[100vw] flex gap-1 pt-1">
          {/* Most Quoted User */}
          <PlaybackAward 
            title="The Public Speaker"
            userId={quoteStats['most_quoted_user']['speaker__discord_id']} 
            flavor_text="Dont Quote That"
            emoji="🔊"
            showNickname
            stat_text={
              <div className="flex gap-1">
                <p>Quoted </p>
                <p className={`font-bold`}>
                  {quoteStats['most_quoted_user']['total_quotes']}
                </p>
                <p>times</p>
              </div>
            }
          />
          {/* Most Quote Submissions */}
          <PlaybackAward 
            title="The Court Stenographer"
            userId={quoteStats['most_quote_submissions']['submitter__discord_id']} 
            flavor_text="Somebody Quote That"
            emoji="👀"
            showNickname
            stat_text={
              <div className="flex gap-1">
                <p>Submitted </p>
                <p className={`font-bold`}>
                  {quoteStats['most_quote_submissions']['total_submissions']}
                </p>
                <p>quotes</p>
              </div>
            }
          />
        </div>
        <p className="mx-auto text-lg">Quote Submission Leaderboard:</p>
        <BasicTable columns={columns} rows={rows} table_label="Photoshop Submissions Leaderboard Table" />
      </div>
    )
  }


  return (
    <div className="w-fit mx-auto p-2 flex flex-col sm:flex-row max-h-[100vh]">
      {/* Leaderboards */}
      <div className="flex flex-col sm:flex-row max-h-[100vh] rounded-2xl p-2 gap-3 items-center">
        {/* Quoted Leaderboard */}
        <div className="flex flex-col max-h-[93%]">
          {quotedColumn()}
        </div>
        {/* Quote Submissions Leaderboard */}
        <div className="flex flex-col max-h-[93%]">
          {quotesSubmittedColumn()}
        </div>
      </div>
    </div>
  )
}