"use server"

import { Button } from "@heroui/button";

import { getUserData, isUserOnline } from "@/app/lib/user_utils";
import PageTitle from "@/app/ui/dashboard/page_title";
import ProfileUserDisplay from "@/app/ui/profile/profile_user_display";
import UserAotdDataDisplay from "@/app/ui/profile/user_aotd_data_display";
import Link from "next/link";
import UserQuotesDisplay from "@/app/ui/profile/user_quotes_display";
import { RiHome2Fill } from "react-icons/ri";

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
    <main className="relative">
      {/* Home Button */}
      <div id="home" className="sticky top-2 left-2 z-50 w-fit mr-auto">
        <Link
          href="/dashboard/aotd"
          className="p-2 border-2 border-gray-600 bg-gray-900 group hover:bg-gray-400 flex rounded-2xl"
        >
          <RiHome2Fill className="text-2xl group-hover:text-black" />
        </Link>
      </div>
      {/* Main Page Content */}
      <div className="flex flex-col items-center lg:p-24 pt-10">
        {/* Page Title */}
        <PageTitle text={`${userData['nickname']}'s Profile`} />
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
      </div>
    </main>
  );
}