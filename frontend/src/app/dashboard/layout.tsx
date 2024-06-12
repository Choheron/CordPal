'use client'

import { Inter } from "next/font/google";
import "@/app/globals.css";
import TopBar from "../ui/dashboard/top_bar";
import { useEffect, useState } from "react";

const inter = Inter({ subsets: ["latin"] });

export default function Layout({ children }: { children: React.ReactNode }) {
  const [userData, setUserData] = useState({})

  useEffect(() => {
    const getDiscordUserData = async () => {
      const userDataResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/discordapi/userData`, {
        method: "GET",
        credentials: "include",
        cache: 'force-cache',
      });
      setUserData(await userDataResponse.json());
    }
    getDiscordUserData()
  }, []);

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
