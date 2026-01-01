"use server"

import BasicTable from "./tables/basic_table"
import UserCard from "../general/userUiItems/user_card"
import BasicPieChart from "./graphs/basic_pie_chart"
import PlaybackAward from "./graphics/playback_award"
import ReviewAvatarCard from "../dashboard/aotd/review_avatar_card"
import ReviewPopoverContent from "../dashboard/aotd/review_small_content"

export default async function GlobalReviewReactionPlayback(props) {
  const reactionStats = props['reviewReactPlaybackData']

  const backgroundGradientTQ = "bg-gradient-to-bl from-slate-900 to-slate-950"

  const displayEmoji = (emojiObj, imgWidth = "30px") => {
    if(emojiObj['custom_emoji'] == true) {
      return (
        <img src={emojiObj['emoji']} width={imgWidth}/>
      )
    } else {
      return <p className="text-2xl">{emojiObj['emoji']}</p>
    }
  }

  const emojiColumn = () => {
    const rows = reactionStats['react_leaderboard'].map((data, index) => {
      return {
        key: index,
        position: index + 1,
        percentage: `${((parseFloat(data['total_reactions'])/parseFloat(reactionStats['total_reactions'])) * 100).toFixed(2)}%`,
        count: data['total_reactions'],
        emoji: displayEmoji(data)
      }
    })
    const columns = [
      {
        key: "position",
        label: "#"
      },
      {
        key: "emoji",
        label: "REACTION",
      },
      {
        key: "percentage",
        label: "PERCENTAGE",
      },
      {
        key: "count",
        label: "TOTAL USES",
      },
    ];

    return (
      <>
        <p className="mx-auto text-lg">Top 10 Reactions Used:</p>
        <BasicTable columns={columns} rows={rows} table_label="Emoji Leaderboard Table" />
      </>
    )
  }

  const reactionsColumn = () => {
    const rows = reactionStats['total_reactions_leaderboard'].map((data, index) => {
      return {
        key: index,
        position: index + 1,
        userdiscordid: (
          <UserCard userDiscordID={data['user__discord_id']} isProfileLink={true}/>
        ),
        userid: data['user__discord_id'],
        percentage: `${((parseFloat(data['total_reactions'])/parseFloat(reactionStats['total_reactions'])) * 100).toFixed(2)}%`,
        count: data['total_reactions']
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
        label: "REACTIONS",
      },
    ];

    return (
      <>
        <div className="max-w-[100vw] flex gap-1 pt-1">
          {/* Most Reactions Given */}
          <PlaybackAward 
            title="Emoji Enthusiast"
            userId={reactionStats['most_reactions_given']['user__discord_id']} 
            flavor_text="Reaction Andy"
            emoji="📣"
            showNickname
            stat_text={
              <div className="flex gap-1">
                <p>Reactions Given:</p>
                <p className={`font-bold`}>
                  {reactionStats['most_reactions_given']['total_reactions']}
                </p>
              </div>
            }
          />
          {/* Most Reactions Recieved */}
          <PlaybackAward 
            title="Crowd Pleaser"
            userId={reactionStats['most_reactions_received']['user__discord_id']} 
            flavor_text="Laughing Rat Farmer"
            emoji="🥇"
            showNickname
            stat_text={
              <div className="flex gap-1">
                <p>Reactions Recieved:</p>
                <p className={`font-bold`}>
                  {reactionStats['most_reactions_received']['total_reactions']}
                </p>
              </div>
            }
          />
        </div>
        <p className="mx-auto text-lg">Reactions Leaderboard:</p>
        <BasicTable columns={columns} rows={rows} table_label="User Reaction Leaderboard Table" />
      </>
    )
  }


  return (
    <div className="w-fit mx-auto p-2 flex flex-col sm:flex-row">
      {/* Leaderboards */}
      <div className="flex flex-col sm:flex-row max-h-[100vh] rounded-2xl p-2 gap-3 items-center">
        {/* Emoji Leaderboard */}
        <div className="flex flex-col max-h-[93%]">
          {emojiColumn()}
        </div>
        {/* Reaction Leaderboard */}
        <div className="flex flex-col max-h-[93%]">
          {reactionsColumn()}
        </div>
        {/* Most Reacted Review */}
        <div className="flex flex-col max-h-[93%]">
          <p className="mx-auto text-lg">{`Most Popular Review (Most Reactions):`}</p>
          <div className="relative w-fit max-h-dvh border-gray-800 bg-black/80 rounded-2xl pt-1 pb-2 px-3 shadow-2xl transition-all">
            <ReviewPopoverContent reviewData={reactionStats['most_reacted_review']} readOnly={true}/>
          </div>
          <p className="max-w-[300px] mx-auto text-xs mt-1 border-gray-800 bg-black/80 rounded-2xl p-2 text-gray-400 italic">
            Note that this reaction data is saved and changing original review will not update this data.
          </p>
        </div>
      </div>
    </div>
  )
}