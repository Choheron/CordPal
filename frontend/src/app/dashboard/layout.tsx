import "@/app/globals.css";
import TopBar from "../ui/dashboard/top_bar";
import { getDiscordUserData, isMember } from "../lib/discord_utils";



export default async function Layout({ children }: { children: React.ReactNode }) {
  // Retrieve user data
  const userData = await getDiscordUserData();
  const memberStatus = await isMember();

  return (
    <div>
      <TopBar userInfo={userData} isMember={memberStatus} />
      {children}
    </div>
  );
}
