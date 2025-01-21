import { getUserData } from "@/app/lib/user_utils";
import PageTitle from "@/app/ui/dashboard/page_title";

// Profile Page
// Route URL: Use GUID from system backend (NOT DISCORD ID)
export default async function Page({
  params,
}: {
  params: Promise<{ userID: string }>
}) {
  const userid = (await params).userID
  // Retreive data from backend
  const userData = await getUserData(userid);

  return (
    <main className="flex min-h-screen flex-col items-center p-24 pt-10">
      <PageTitle text={`${userData['nickname']}'s Profile`} />
    </main>
  );
}