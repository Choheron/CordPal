'use server'

import { Conditional } from "../conditional"
import UserCard from '../../general/userUiItems/user_card';
import { getAlbumsStats } from "@/app/lib/spotify_utils";
import { Divider } from "@nextui-org/react";

// GUI Display for an Album
// Expected Props:
//   - NONE YET
export default async function MusicStatsBox(props) {
  const albumStatsJson = await getAlbumsStats();

  const userDiv = albumStatsJson['user_objs'].map((user, index) => {
    return (
      <div 
        key={user['submission_count']}
        className="flex justify-between w-full my-1"
      >
        <UserCard
          userDiscordID={user['discord_id']}
        />
        <p className="my-auto px-2 py-1 bg-gray-800 rounded-full">
          {user['submission_count']}
        </p>
      </div>
    )
  })

  return (
    <div className="w-fill min-w-[340px] mx-2 lg:mx-1 my-2 px-2 py-2 flex flex-col lg:flex-row rounded-2xl bg-zinc-800/30 border border-neutral-800">
      {/* Album Submission Stats */}
      <div className='min-w-[300px] w-fit flex flex-col'>
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
        <Divider className="my-1" />
        {userDiv}
      </div>
    </div>
  )
}