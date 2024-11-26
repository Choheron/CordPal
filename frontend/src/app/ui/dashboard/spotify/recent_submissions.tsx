'use server'

import {User} from "@nextui-org/user";

import { convertToLocalTZString } from "@/app/lib/utils";

// GUI Display for recent submissions
// Expected Props:
//   - albumList: List of Objects - List of recent submissions
export default async function RecentSubmissions(props) {
  // Album props checks
  const recentSubs = (props.albumList) ? props.albumList : [];

  return (
    <div className="w-[340px] mx-2 lg:mx-1 my-2 flex flex-col rounded-2xl bg-zinc-800/30 border border-neutral-800">
      <p className='text-xl mx-auto py-2 font-extralight'>Recent Album Submissions:</p>
      <div className="flex flex-col justify-around h-full mx-auto">
        {recentSubs.length === 0 ? (
            <p className='mx-auto my-auto'>No Recent Submissions...</p>
          ) : (
            recentSubs.map((submission, index) => (
              <div className="ml-1" key={index}>
                <User
                  name={(
                    <a href={submission['album_src']} className="hover:underline">
                      {submission['title']}
                    </a>
                  )}
                  description={"Submitted by: " + submission['submitter']}
                  avatarProps={{
                    name: submission['title'],
                    src: submission['album_img_src'],
                    size: "lg"
                  }}
                />
              </div>
            ))
          )
        }
      </div>
      <p className="mx-auto text-sm text-gray-500 italic">Last Updated: {convertToLocalTZString(props.timestamp, true)}</p>
    </div>
  )
}