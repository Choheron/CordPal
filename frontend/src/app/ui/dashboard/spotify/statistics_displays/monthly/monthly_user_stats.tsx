"use client"

import { ratingToTailwindBgColor } from "@/app/lib/utils";
import CustomPercentageDisplay from "@/app/ui/general/charts/custom_percentage_display";
import { RosenBarChartHorizontal } from "@/app/ui/general/charts/rosen_barchart_horizontal";
import StarRating from "@/app/ui/general/star_rating";
import { Divider, Tab, Tabs, User } from "@heroui/react"


// Expected Props:
//  - aotdStats: Obj - Object containing Album Of the Day stats for the month
//  - subData: Obj - Object containing submission data for the month
//  - spotifyUserData: Object - Data for all users who have authenticated with spotify
//  - reviewData: Obj - Object containing review data for that month
//  - year: String - Year of month
//  - month: String - Zero padded month number string
//  - monthName: String - Human readable month name
export default function MonthlyUserStats(props) {
  // Prop retrieval
  const year = (props.year) ? props.year : null;
  const month = (props.month) ? props.month : null;
  const monthName = (props.monthName) ? props.monthName : null;
  const aotdData = (props.aotdData) ? props.aotdData : null;
  const aotdStats = (aotdData['stats']) ? aotdData['stats'] : null;
  const subData = (props.subData) ? props.subData : null;
  const reviewData = (props.reviewData) ? props.reviewData : null;
  // Retrieve data from props
  const user_review_stats = reviewData['user_stats']
  const user_sub_stats = subData['user_stats']
  const user_sel_stats = aotdStats['user_stats']
  // Get list of spotify users from passed in props and map it to the correct format
  const users = props.spotifyUserData.map((user, index) => {
    const userObj = {
      key: index,
      discord_id: user['discord_id'],
      avatar_url: user['avatar_src'],
      nickname: user['nickname']
    }
    // Only return a user if they have left reviews or submitted items
    if(getUserReviewData(user['discord_id'], 'review_count') != 0) {
      return userObj
    }
  })

  // Display albums submitted by the user with the passed in id
  const displayAlbums = (discord_id, title, albumsList) => {
    const getArtist = (albumObj) => {return (albumObj['artist']['name']) ? albumObj['artist']['name'] : albumObj['artist']}

    return (
      <div className="w-full h-full rounded-2xl bg-black/30 border border-neutral-800 -pb-10">
        <p className="w-full text-center rounded-tl-2xl rounded-tr-2xl bg-gray-800">
          {title}
        </p>
        <div className="relative h-[95%] bg-black/90 rounded-b-2xl">
          <div className="absolute flex flex-wrap justify-center w-full h-fit max-h-full overflow-auto scrollbar-hide mx-2 pr-4">
          {
            albumsList.map((album, index) => {
              return (
                <div 
                  className="group relative flex h-[40%] md:h-[30%] w-[40%] md:w-[30%] m-1"
                  key={index}
                >
                  <img 
                    src={(album['cover_url']) ? album['cover_url'] : album['album_img_src']}
                    className='h-full w-full rounded-2xl mx-auto group-hover:blur-sm duration-700 ease-in-out group-hover:brightness-50'
                    alt={`Album Cover for ${album['title']} by ${getArtist(album)}`}
                  />
                  <a 
                    href={`/dashboard/spotify/album/${album['spotify_id']}`}
                    className="absolute flex flex-col h-full w-full justify-center transition opacity-0 group-hover:opacity-100 ease-in-out lg:gap-2 bg-transparent py-0 px-1"
                  >
                    <p className="text-center text-md line-clamp-2">
                      <b>{album['title']}</b>
                    </p>
                    <p className="text-center text-sm italic text-wrap">
                      {getArtist(album)}
                    </p>
                  </a>
                </div>
              )
            })
          }
          </div>
        </div>
      </div>
    )
  }

  // Return user review data (for readability lower down)
  function getUserReviewData(discord_id, data_key) {
    try{
      return (user_review_stats[discord_id][data_key])
    } catch {
      return 0
    }
  }

  // Return user submission data (for readability lower down)
  function getUserSubData(discord_id, data_key) {
    try{
      return (user_sub_stats[discord_id][data_key])
    } catch {
      return 0
    }
  }

  // Return user selection data (for readability lower down)
  function getUserSelData(discord_id, data_key) {
    try{
      return (user_sel_stats[discord_id][data_key])
    } catch {
      return 0
    }
  }


  return (
    <div className="w-full 2xl:w-3/4 h-full mx-auto border bg-zinc-800/30 border-neutral-800 rounded-2xl py-2">
      <Tabs
        isVertical={true}
        items={users}
        className="ml-2"
        variant="light"
      >
        {(item: any) => (
          <Tab 
            key={item.key} 
            title={(
              <User 
                avatarProps={{
                  src: item.avatar_url,
                }}
                name={item.nickname}
              />
            )}
            className="w-full h-full justify-start"
          >
            <div className="flex flex-col w-full h-full backdrop-blur-2xl px-2 py-2 rounded-2xl bg-zinc-800/30 border border-neutral-800">
              <p className="font-extralight w-full text-center text-xl mb-1">
                {monthName} {year} Statistics for {item.nickname}:
              </p>
              <Divider />
              <div className="flex flex-col lg:flex-row h-full gap-2 font-extralight">
                {/* Review Stats for User */}
                <div className="flex flex-col w-fit mt-2 text-center border border-zinc-800 rounded-xl p-2 px-3 bg-slate-400/10">
                  <p className="text-xl">Review Statistics:</p>
                  <Divider />
                  <div className="flex justify-between w-full mt-1">
                    <p className="my-auto">Reviews Submitted:</p>
                    <p className="my-auto px-4 py-1 bg-gray-800 rounded-full">
                      {getUserReviewData(item.discord_id, 'review_count')}
                    </p>
                  </div>
                  <div className="flex justify-between w-full mt-1">
                    <p className="my-auto">First Listens:</p>
                    <p className="my-auto px-4 py-1 bg-gray-800 rounded-full">
                      {getUserReviewData(item.discord_id, 'first_listen_count')}
                    </p>
                  </div>
                  <Divider className="my-1" />
                  <div className="flex justify-between w-full mt-1">
                    <p className="my-auto">
                      Average Review Score:
                    </p>
                    <div className="font-normal">
                      <p className={`my-auto mx-auto px-2 py-1 mb-1 ${ratingToTailwindBgColor(getUserReviewData(item.discord_id, 'review_average').toFixed(2))} rounded-full text-black w-fit`}>
                        <b>{getUserReviewData(item.discord_id, 'review_average').toFixed(2)}</b>
                      </p>
                      <StarRating
                        rating={getUserReviewData(item.discord_id, 'review_average')}
                        textSize={"text-2xl"}
                      />
                    </div>
                  </div>
                  <CustomPercentageDisplay
                    title={"Percentage of First Time Listens:"}
                    percentage={getUserReviewData(item.discord_id, 'first_listen_percentage').toFixed(2)}
                    underColor="bg-green-600"
                    underLabel={getUserReviewData(item.discord_id, 'first_listen_count')}
                    overColor="bg-green-900"
                    overLabel={getUserReviewData(item.discord_id, 'review_count') - getUserReviewData(item.discord_id, 'first_listen_count')} 
                  />
                  <Divider className="my-1" />
                  <p>Review Scores/Percentages Chart:</p>
                  <RosenBarChartHorizontal 
                    data={getUserReviewData(item.discord_id, 'score_breakdown').map((scoreObj, index) => {
                      return(
                        {
                          "key_label": "Score",
                          "key": scoreObj['score'],
                          "percent": `${scoreObj['percent'].toFixed(2)}%`,
                          "value": scoreObj['count'],
                          "color": ratingToTailwindBgColor(scoreObj['score'])
                        }
                      )}
                    )}
                  />
                </div>
                {/* Submission Stats for User */}
                <div className="flex flex-col w-full mt-2 text-center border border-zinc-800 rounded-xl p-2 px-3 bg-slate-400/10">
                  <p className="text-xl">Submission Statistics:</p>
                  <Divider />
                  <div className="flex justify-between w-full mt-1">
                    <p className="my-auto">Albums Submitted:</p>
                    <p className="my-auto px-4 py-1 bg-gray-800 rounded-full">
                      {getUserSubData(item.discord_id, 'count')}
                    </p>
                  </div>
                  <CustomPercentageDisplay
                    title={`Percentage vs Total:`}
                    percentage={getUserSubData(item.discord_id, 'percent').toFixed(2)}
                    underColor="bg-green-600"
                    underLabel={getUserSubData(item.discord_id, 'count')}
                    overColor="bg-green-900"
                    overLabel={subData['submission_total'] - getUserSubData(item.discord_id, 'count')} 
                  />
                  <Divider className="my-1" />
                  {displayAlbums(item.discord_id, "Albums Submitted:", getUserSubData(item.discord_id, 'submissions'))}
                </div>
                {/* Selection Stats for User */}
                <div className="flex flex-col w-full mt-2 text-center border border-zinc-800 rounded-xl p-2 px-3 bg-slate-400/10">
                  <p className="text-xl">Selection Statistics:</p>
                  <Divider />
                  <div className="flex justify-between w-full mt-1">
                    <p className="my-auto">Albums Selected:</p>
                    <p className="my-auto px-4 py-1 bg-gray-800 rounded-full">
                      {getUserSelData(item.discord_id, 'count')}
                    </p>
                  </div>
                  <CustomPercentageDisplay
                    title={`Percentage vs Total:`}
                    percentage={getUserSelData(item.discord_id, 'percent').toFixed(2)}
                    underColor="bg-green-600"
                    underLabel={getUserSelData(item.discord_id, 'count')}
                    overColor="bg-green-900"
                    overLabel={aotdStats['selection_total'] - getUserSelData(item.discord_id, 'count')} 
                  />
                  <Divider className="my-1" />
                  {displayAlbums(
                    item.discord_id, 
                    "Albums Selected:", 
                    ((getUserSelData(item.discord_id, 'selection_dates') != 0) ? getUserSelData(item.discord_id, 'selection_dates') : [] ).map((date) => aotdData[date])
                  )}
                </div>
              </div>
            </div>
          </Tab>
        )}
      </Tabs>
    </div>
  )
}