'use server'

import {User} from "@nextui-org/user";
import { Button } from "@nextui-org/react";

import { convertToLocalTZString } from "@/app/lib/utils";
import ClientTimestamp from "../../general/client_timestamp";
import Link from "next/link";

// GUI Display for recent submissions
// Expected Props:
//   - albumList: List of Objects - List of recent submissions
export default async function RecentSubmissions(props) {
  // Album props checks
  const recentSubs = (props.albumList) ? props.albumList : [];

  return (
    <div className="min-w-[320px] w-[340px] mx-auto lg:mx-1 lg:my-2 flex flex-col backdrop-blur-2xl rounded-2xl bg-zinc-800/30 border border-neutral-800">
      <p className='text-xl mx-auto py-2 font-extralight'>Recent Album Submissions:</p>
      <div className="flex flex-col justify-around h-full mx-auto">
        {recentSubs.length === 0 ? (
            <p className='mx-auto my-auto'>No Recent Submissions...</p>
          ) : (
            recentSubs.map((submission, index) => (
              <div className="ml-1" key={index}>
                <Button 
                  as={Link}
                  href={"/dashboard/spotify/album/" + submission['spotify_id']}
                  radius="lg"
                  className={`h-fit w-full hover:underline text-white py-1`}
                  variant="light"
                >
                  <div className="w-full">
                    <User
                      name={(
                        <p className="hover:underline line-clamp-1 max-w-56">
                          {(submission['title'].length > 27) ? (submission['title'].substring(0, 27) + "...") : submission['title']}
                        </p>
                      )}
                      description={"Submitted by: " + submission['submitter']}
                      avatarProps={{
                        name: submission['title'],
                        src: submission['album_img_src'],
                        size: "lg",
                      }}
                    />
                  </div>
                </Button>
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