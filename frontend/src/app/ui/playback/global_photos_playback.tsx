"use server"

import BasicTable from "./tables/basic_table"
import UserCard from "../general/userUiItems/user_card"
import BasicPieChart from "./graphs/basic_pie_chart"
import PlaybackAward from "./graphics/playback_award"
import { getUserData } from "@/app/lib/user_utils"

export default async function GlobalPhotoPlaybackData(props) {
  const photoStats = props['photoPlaybackData']
  const mostTaggedNickname = (await getUserData(photoStats['most_tagged_user']['discord_id']))['nickname']

  const backgroundGradientTQ = "bg-gradient-to-bl from-slate-900 to-slate-950"

  const awardColumn = () => {
    const rows = photoStats['total_submissions_leaderboards'].map((data, index) => {
      return {
        key: index,
        position: index + 1,
        userdiscordid: (
          <UserCard userDiscordID={data['uploader__discord_id']} isProfileLink={true}/>
        ),
        userid: data['uploader__discord_id'],
        percentage: `${((parseFloat(data['upload_count'])/parseFloat(photoStats['total_submissions'])) * 100).toFixed(2)}%`,
        count: data['upload_count']
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
        label: "UPLOADS",
      },
    ];

    return (
      <>
        <div className="max-w-[100vw] flex gap-1 pt-1">
          {/* Artist of the Most Photos */}
          <PlaybackAward 
            title="The Artist"
            userId={photoStats['most_artist_user']['discord_id']} 
            flavor_text={`${mostTaggedNickname} photoshops dont make themselves`}
            emoji="🎨"
            showNickname
            stat_text={
              <div className="flex gap-1">
                <p>Artist of </p>
                <p className={`font-bold`}>
                  {photoStats['most_artist_user']['artist_count']}
                </p>
                <p>photos</p>
              </div>
            }
          />
          {/* Tagged in the most photos */}
          <PlaybackAward 
            title="The Muse"
            userId={photoStats['most_tagged_user']['discord_id']} 
            flavor_text="Splona Lisa"
            emoji="🖌️"
            showNickname
            stat_text={
              <div className="flex gap-1">
                <p>Tagged in </p>
                <p className={`font-bold`}>
                  {photoStats['most_tagged_user']['tagged_count']}
                </p>
                <p>photos</p>
              </div>
            }
          />
        </div>
        <p className="mx-auto text-lg">Photoshop Submissions Leaderboard:</p>
        <BasicTable columns={columns} rows={rows} table_label="Photoshop Submissions Leaderboard Table" />
        <BasicPieChart chartData={rows} title_text={`Total Submissions: ${photoStats['total_submissions']}`} tooltip_text="Breakdown of submitted Photoshops, by user."/>
      </>
    )
  }


  return (
    <div className="w-fit mx-auto p-2 flex flex-col sm:flex-row">
      {/* Leaderboards */}
      <div className="flex flex-col sm:flex-row max-h-[100vh] rounded-2xl p-2 gap-3 items-center">
        {/* Reaction Leaderboard */}
        <div className="flex flex-col max-h-[95%]">
          {awardColumn()}
        </div>
      </div>
    </div>
  )
}