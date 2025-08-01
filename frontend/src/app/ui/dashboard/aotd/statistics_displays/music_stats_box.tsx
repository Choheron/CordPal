'use server'

import UserCard from "@/app/ui/general/userUiItems/user_card";
import { getAlbumAvgRating, getAlbumsStats, getAllUserReviewStats, getChanceOfAotdSelect, getLowestHighestAlbumStats } from "@/app/lib/aotd_utils";

import {Badge} from "@heroui/badge";
import { Divider, Tooltip } from "@heroui/react";
import { dateToString, ratingToTailwindBgColor } from "@/app/lib/utils";
import ReviewStatsUserCard from "./review_stats_user_card";
import MinimalAlbumDisplay from "../minimal_album_display";
import CreateOutageModal from "../modals/create_outage_modal";
import AlbumDisplay from "../album_display";

// GUI Display for an Album
// Expected Props:
//   - NONE YET
export default async function MusicStatsBox(props) {
  const albumStatsJson = await getAlbumsStats();
  const albumLowHighStatsJson = await getLowestHighestAlbumStats();
  const userReviewStatsJson = await getAllUserReviewStats();


  const albumUserStatsTable = albumStatsJson['user_objs'].sort((a, b) => a['selection_chance'] < b['selection_chance'] ? 1 : -1).map((user, index) => {
    return (
      <tr 
        key={`${user['submission_count']} ${user['nickname']}`}
      >
        <td className="line-clamp-1 mx-2">
          <UserCard
            userDiscordID={user['discord_id']}
            avatarClassNameOverride="size-[35px] flex-shrink-0"
            customDescription={(
              <Tooltip 
                content={
                  <div className="flex flex-col">
                    <p>{`${user['nickname']}'s albums are currently ${(user['selection_blocked']) ? "BLOCKED": "ALLOWED"} for selection.`}</p>
                    {(user['block_type']) ? (<p><b>Block Type:</b> {user['block_type']}</p>) : <></>}
                    {(user['selection_blocked']) ? (<p><b>Reason:</b> <i>{user['reason']}</i></p>) : <></>}
                    <p>{`${(user['block_type'] == "OUTAGE") ? (user['admin_outage'] == "true") ? `Outage placed by admins.` : `Outage placed by ${user['nickname']}.` : ""}`}</p>
                    <p>{(user['block_type'] == "OUTAGE") ? `This outage lasts until: ${user['outage_end']}` : ``}</p>
                    <p>{`User has submitted ${user['submission_count']} album(s).`}</p>
                  </div>
                }
                className="max-w-[300px] mb-5"
              >
                <div className="flex">
                  {(user['selection_blocked']) ? ((user['block_type'] == "OUTAGE") ? (<p>✖️</p>) : (<p>&#9940;</p>)) : (<p>&#9989;</p>)}
                  <p>{user['selection_chance'].toFixed(3)}%</p>
                </div>
              </Tooltip>
            )}
            isProfileLink
          />
        </td>
        <td>
          <p className="mx-auto px-2 py-1 bg-gray-800 rounded-full w-fit">
            {user['aotd_count']}
          </p>
        </td>
        <td>
          <p className="mx-auto px-2 py-1 bg-gray-800 rounded-full w-fit">
            {user['unpicked_count']}
          </p>
        </td>
      </tr>
    )
  })

  const reviewUserStatsList = userReviewStatsJson['review_data'].sort((a, b) => a['total_reviews'] < b['total_reviews'] ? 1 : -1).map((user) => {
    return (
      <div 
        key={`${user['discord_id']}-${user['total_reviews']}`}
        className="flex justify-between w-full my-1"
      >
        <ReviewStatsUserCard 
          userDiscordID={user['discord_id']} 
          userReviewObj={user} 
        />
        <p className="my-auto px-2 py-1 bg-gray-800 rounded-full">
          {user['total_reviews']}
        </p>
      </div>
    )
  })

  return (
    <div className="w-fill min-w-[340px] mx-2 lg:mx-0 my-2 px-2 py-2 flex flex-col lg:flex-row gap-10 backdrop-blur-2xl rounded-2xl bg-zinc-800/30 border border-neutral-800">
      {/* Album Submission Stats */}
      <div className='min-w-[300px] w-[300px] mx-auto flex flex-col'>
        <p className="mx-auto text-xl underline mb-1">
          Album Submission Stats: 
        </p>
        <div className="flex gap-2 justify-between w-full">
          <p>
            Total Albums Submitted:
          </p>
          <p>
            {albumStatsJson['total_albums']}
          </p>
        </div>
        <div className="border py-1 px-2 border-neutral-800 bg-black/40 rounded-xl text-center max-w-[400px] my-1 text-sm italic font-extralight">
          <p>
            Selection status is shown as it would be for each user at midnight tonight, Central Time.
          </p>
        </div>
        <Divider className="my-1" />
        <div className="flex flex-col justify-between h-full">
          <table className="table-fixed w-full">
            <thead>
              <tr>
                <th className="w-1/2">User</th>
                <th className="w-1/4 pl-1">AOtD</th>
                <th className="w-1/4 px-1">Unpicked</th>
              </tr>
            </thead>
            <tbody>
              {albumUserStatsTable}
            </tbody>
          </table>
          <CreateOutageModal />
        </div>
      </div>
      {/* Lowest and Highest Album Stats */}
      <div className="w-fit flex flex-col">
        {/* Album Highest Stats */}
        <div className='w-full lg:w-[650px] mx-auto flex flex-col'>
          <p className="mx-auto text-xl underline mb-2">
            Highest Album: {dateToString(albumLowHighStatsJson['highest_album']['date'])}
          </p>
          <div className="mx-auto">
            <AlbumDisplay
              title={albumLowHighStatsJson['highest_album']["title"]}
              album_mbid={albumLowHighStatsJson['highest_album']["mbid"]}
              album_img_src={albumLowHighStatsJson['highest_album']["cover_url"]}
              album_src={albumLowHighStatsJson['highest_album']["album_url"]}
              artist={{"name": albumLowHighStatsJson['highest_album']["artist"], "href": albumLowHighStatsJson['highest_album']["artist_url"]}}
              submitter={albumLowHighStatsJson['highest_album']["submitter_id"]}
              submitter_comment={albumLowHighStatsJson['highest_album']["user_comment"]}
              submission_date={albumLowHighStatsJson['highest_album']["submission_date"]}
              historical_date={albumLowHighStatsJson['highest_album']['date']}
              sizingOverride="h-full w-full lg:h-[300px] lg:w-[300px]"
              showAlbumRating={2}
              starTextOverride="text-3xl"
              showCalLink={true}
            />
          </div>
          <Divider className="my-1" />
          {/* Album Lowest Stats */}
          <p className="mx-auto text-xl underline mb-2">
            Lowest Album: {dateToString(albumLowHighStatsJson['lowest_album']['date'])}
          </p>
          <div className="mx-auto">
            <AlbumDisplay
              title={albumLowHighStatsJson['lowest_album']["title"]}
              album_mbid={albumLowHighStatsJson['lowest_album']["mbid"]}
              album_img_src={albumLowHighStatsJson['lowest_album']["cover_url"]}
              album_src={albumLowHighStatsJson['lowest_album']["album_url"]}
              artist={{"name": albumLowHighStatsJson['lowest_album']["artist"], "href": albumLowHighStatsJson['lowest_album']["artist_url"]}}
              submitter={albumLowHighStatsJson['lowest_album']["submitter_id"]}
              submitter_comment={albumLowHighStatsJson['lowest_album']["user_comment"]}
              submission_date={albumLowHighStatsJson['lowest_album']["submission_date"]}
              historical_date={albumLowHighStatsJson['lowest_album']['date']}
              sizingOverride="h-full w-full lg:h-[300px] lg:w-[300px]"
              showAlbumRating={2}
              starTextOverride="text-3xl"
              showCalLink={true}
            />
          </div>
        </div>
        <div className="lg:w-[650px] mx-auto px-2 py-2 mt-2 text-small text-center italic border border-neutral-800 rounded-2xl bg-zinc-800/30">
          <p>In order to be considered for highest or lowest album, an album must have 4 or more reviews. Any album with 3 or less reviews will not be counted.</p>
        </div>
      </div>
      {/* Review Stats */}
      <div className='min-w-[300px] w-[300px] mx-auto flex flex-col'>
        <p className="mx-auto text-xl underline mb-1">
          Review Stats: 
        </p>
        <div className="flex gap-2 justify-between w-full">
          <p>
            Total Reviews Submitted:
          </p>
          <p>
            {userReviewStatsJson['total_reviews']}
          </p>
        </div>
        <Divider className="my-1" />
        {reviewUserStatsList}
      </div>
    </div>
  )
}