import { getUserData, isUserOnline } from "@/app/lib/user_utils";
import { boolToEmoji, formatDateString } from "@/app/lib/utils";
import PageTitle from "@/app/ui/dashboard/page_title";
import ClientTimestamp from "@/app/ui/general/client_timestamp";
import { Button } from "@nextui-org/react";
import { revalidateTag } from "next/cache";
import Link from "next/link";

// Profile Page
// Route URL: Use userID to get data from backend
export default async function Page({
  params,
}: {
  params: Promise<{ userid: string }>
}) {
  const userid = (await params).userid
  // Force revalidation of user data every time a profile is loaded
  revalidateTag("user-data")
  // Retreive data from backend
  const userData = await getUserData(userid);
  // Get status of user being online
  const online = await isUserOnline(userData['discord_id'])

  return (
    <main className="flex min-h-screen flex-col items-center p-24 pt-10">
      <PageTitle text={`${userData['nickname']}'s Profile`} />
      <Button 
        as={Link}
        href={"/dashboard"}
        radius="lg"
        className={`w-fit hover:underline text-white bg-gradient-to-br`}
        variant="solid"
      >
        <b>Return to Homepage</b>
      </Button> 
      <div className="w-fit mx-auto lg:max-w-[1080px] flex flex-col gap-2 lg:flex-row backdrop-blur-2xl px-2 py-2 my-2 rounded-2xl bg-zinc-800/30 border border-neutral-800">
        <img 
          src={userData['avatar_url']}
          className='h-[125px] w-[125px] lg:h-[200px] lg:w-[200px] rounded-2xl mx-auto'
          alt={`Profile Picture for ${userData['nickname']}`}
        />
        <div className="flex flex-col justify-between font-extralight">
          <div className="flex flex-col min-w-[350px] w-fit">
            <div className="w-full flex justify-between">
              <p>Nickname:</p>
              <p>{userData['nickname']}</p>
            </div>
            <div className="w-full flex justify-between font-extralight">
              <p>Member Since:</p>
              <ClientTimestamp timestamp={formatDateString(userData['creation_timestamp'])}/>
            </div>
            <div className="w-full flex justify-between font-extralight">
              <p>Last Seen:</p>
              <ClientTimestamp timestamp={formatDateString(userData['last_request_timestamp'])} full/>
            </div>
            <div className="w-full flex justify-between font-extralight">
              <p>Spotify Connected:</p>
              <div dangerouslySetInnerHTML={{__html: boolToEmoji(userData['spotify_connected'])}}></div>
            </div>
          </div>
          <div className="flex w-full justify-end">
            <p>{(online) ? "Online" : "Offline"}</p>
            <div className={`w-[10px] h-[10px] mx-2 my-auto rounded-full border-2 border-black ${online ? "bg-green-600" : "bg-red-700"}`}></div>
          </div>
        </div>
      </div>
    </main>
  );
}