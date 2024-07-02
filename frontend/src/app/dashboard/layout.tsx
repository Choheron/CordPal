import { Inter } from "next/font/google";
import "@/app/globals.css";
import TopBar from "../ui/dashboard/top_bar";
import { getDiscordUserData, isMember } from "../lib/discord_utils";

const inter = Inter({ subsets: ["latin"] });

export default async function Layout({ children }: { children: React.ReactNode }) {
  const userData = await getDiscordUserData();

  return (
    <html lang="en">
      <head><link rel="icon" href="/favicon.png" sizes="any" /></head>
      <body className={inter.className}>
        <TopBar userInfo={userData} isMember={await isMember()} />
        {children}
      </body>
    </html>
  );
}
