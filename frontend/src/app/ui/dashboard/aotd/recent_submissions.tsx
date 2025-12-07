'use server'

import { User } from "@heroui/user";
import { Button } from "@heroui/button";

import ClientTimestamp from "../../general/client_timestamp";
import Link from "next/link";

// GUI Display for recent submissions
// Expected Props:
//   - albumList: List of Objects - List of recent submissions
export default async function RecentSubmissions(props) {
  // Album props checks
  const recentSubs = (props.albumList) ? props.albumList : [];

  return (
    <div className="max-h-[450px] min-w-[320px] w-full lg:w-full lg:mt-2 lg:mb-1 flex flex-col backdrop-blur-2xl rounded-2xl bg-zinc-800/30 border border-neutral-800 overflow-y-auto">
      <p className='text-xl mx-auto py-2 font-extralight'>Recent Album Submissions:</p>
      <div className="flex flex-col justify-around h-full mx-auto">
        {recentSubs.length === 0 ? (
            <p className='mx-auto my-auto'>No Recent Submissions...</p>
          ) : (
            recentSubs.map((submission, index) => (
              <div className="ml-1" key={index}>
                <Link
                  href={"/dashboard/aotd/album/" + submission['album_id']}
                  prefetch={false}
                  className="flex w-full p-0 items-start"
                >
                  <Button
                    radius="lg"
                    className={`group h-fit w-full hover:underline text-white pt-1 text-left`}
                    variant="light"
                  >
                    <div className="w-full">
                      <User
                        name={(
                          <p className="group-hover:underline line-clamp-1 max-w-56 text-lg">
                            {submission['title']}
                          </p>
                        )}
                        description={
                          <div>
                            <p>{submission['artist']}</p>
                            <p className="text-xs">{"Submitted by: " + submission['submitter']}</p>
                          </div>
                        }
                        avatarProps={{
                          name: submission['title'],
                          src: `/dashboard/aotd/api/album-cover/${submission['album_id']}`,
                          className: "size-16",
                          radius: "sm"
                        }}
                      />
                    </div>
                  </Button>
                </Link>
              </div>
            ))
          )
        }
      </div>
      <div className="flex mx-auto text-sm text-gray-500 italic">
        Last Updated: 
        <ClientTimestamp className="ml-2" timestamp={props.timestamp} full={true} />
      </div>
    </div>
  )
}