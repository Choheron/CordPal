import { User } from "@heroui/user";
import { Button } from "@heroui/button";

import ClientTimestamp from "../../general/client_timestamp";
import Link from "next/link";
import { Conditional } from "../conditional";

// GUI Display for recent submissions
// Expected Props:
//   - actionList: List of Objects - List of recent submissions
export default async function RecentSubmissions(props) {
  // Album props checks
  const recentActions = (props.actionList) ? props.actionList : [];

  return (
    <div className="h-full w-full lg:w-[350px] flex flex-col backdrop-blur-2xl rounded-2xl bg-zinc-800/30 border border-neutral-800">
      <p className='text-xl mx-auto py-2 font-extralight'>Recent Album Subs&#47;Rescues:</p>
      <div className="flex flex-col justify-around h-full mx-auto overflow-y-auto">
        {recentActions.length === 0 ? (
            <p className='mx-auto my-auto'>No Recent Submissions/Rescues...</p>
          ) : (
            recentActions.map((action, index) => (
              <div className="ml-1" key={index}>
                <Link
                  href={"/dashboard/aotd/album/" + action['album']['mbid']}
                  prefetch={false}
                  className="flex w-full p-0 items-start"
                >
                  <Button
                    radius="lg"
                    className={`relative group h-fit w-full hover:underline text-white pt-1 text-left overflow-clip`}
                    variant="light"
                  >
                    <Conditional showWhen={action['action'] == "UPDATE"}>
                      <p className="absolute z-10 top-4 -right-10 rotate-45 bg-orange-600 px-10 py-[2px] text-xs text-white font-bold">
                        RESCUE
                      </p>
                    </Conditional>
                    <div className="w-full">
                      <User
                        name={(
                          <p className="group-hover:underline line-clamp-1 max-w-56 text-lg">
                            {action['album']['title']}
                          </p>
                        )}
                        description={
                          (action['action'] == "UPDATE") ? (
                            <div>
                              <p className="line-clamp-1 max-w-56">{action['album']['artist']}</p>
                              <p className="text-xs">{"Rescuer: " + action['action_details']['new_owner_nick']}</p>
                              <p className="text-xs">{"Abandoner: " + action['action_details']['previous_owner_nick']}</p>
                            </div>
                          ) : (
                            <div>
                              <p className="line-clamp-1 max-w-56">{action['album']['artist']}</p>
                              <p className="text-xs">{"Submitter: " + action['album']['submitter']}</p>
                            </div>
                          )
                        }
                        avatarProps={{
                          name: action['album']['title'],
                          src: `/dashboard/aotd/api/album-cover/${action['album']['mbid']}`,
                          className: "size-[75px]",
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