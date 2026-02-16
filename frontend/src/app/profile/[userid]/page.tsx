"use server"

import { Button } from "@heroui/button";

import { getUserData, isUserOnline } from "@/app/lib/user_utils";
import PageTitle from "@/app/ui/dashboard/page_title";
import ProfileUserDisplay from "@/app/ui/profile/profile_user_display";
import UserAotdDataDisplay from "@/app/ui/profile/user_aotd_data_display";
import Link from "next/link";
import UserQuotesDisplay from "@/app/ui/profile/user_quotes_display";

// Profile Page
// Route URL: Use userID to get data from backend
export default async function Page({
  params,
}: {
  params: Promise<{ userid: string }>
}) {
  const userid = (await params).userid
  // Retreive data from backend
  const userData = await getUserData(userid);
  // Get status of user being online
  const onlineData = await isUserOnline(userData['discord_id'])

  return (
    <main className="flex flex-col items-center lg:p-24 pt-10">
      <PageTitle text={`${userData['nickname']}'s Profile`} />
      <Link
        href={"/dashboard"}
      >
        <Button 
          radius="lg"
          className={`w-fit hover:underline text-white bg-gradient-to-br`}
          variant="solid"
        >
          <b>Return to Homepage</b>
        </Button>
      </Link>
      <div className="flex flex-col xl:flex-row gap-2">
        <div className="w-full xl:w-1/2">
          <ProfileUserDisplay 
            userData={userData}
            onlineData={onlineData}
          />
          <UserAotdDataDisplay 
            userId={userid}
            aotdParticipant={userData['aotd_enrolled']}
          />
        </div>
        <div className="w-full xl:w-1/2">
          {/* User's Quotes */}
          <UserQuotesDisplay 
            userId={userid}
            userData={userData}
          />
        </div>
      </div>
    </main>
  );
}