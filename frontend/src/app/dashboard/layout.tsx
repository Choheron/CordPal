import { Inter } from "next/font/google";
import Link from "next/link";
import "@/app/globals.css";
import { getDiscordUserData } from "../lib/discord_utils";
import TopBar from "../ui/dashboard/top_bar";

const inter = Inter({ subsets: ["latin"] });

export default async function Layout({ children }: { children: React.ReactNode }) {
  const userData = await getDiscordUserData(); 
  console.log(userData);

  return (
    <html lang="en">
      <head><link rel="icon" href="/favicon.png" sizes="any" /></head>
      <body className={inter.className}>
        <TopBar userInfo={userData} />
        {children}
      </body>
    </html>
  );
}
