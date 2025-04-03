import { isMember } from "@/app/lib/discord_utils";
import { getUserData, isUserOnline } from "@/app/lib/user_utils";
import PageTitle from "@/app/ui/dashboard/page_title";
import ProfileUserDisplay from "@/app/ui/profile/profile_user_display";
import UserAlbumFavDisplay from "@/app/ui/profile/user_album_fav_display";
import { Button } from "@heroui/react";
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
  const onlineData = await isUserOnline(userData['discord_id'])

  return (
    <main className="flex flex-col items-center lg:p-24 pt-10">
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
      <div className="w-fit">
        <ProfileUserDisplay 
          userData={userData}
          onlineData={onlineData}
        />
        <UserAlbumFavDisplay 
          userId={userid}
          spotifyConnected={userData['spotify_connected']}
        />
      </div>
    </main>
  );
}