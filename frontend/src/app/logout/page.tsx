'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation'
import { discordLogout } from '../lib/discord_utils';


export default async function Page() {
  const router = useRouter();

  useEffect(() => {
    const doDiscordLogout = async () => {
      await discordLogout()
      console.log("Logout completed, redirecting...");
      router.push("/");
    }
    doDiscordLogout()
  }, []);


  return (
    <main className="flex min-h-screen flex-col items-center p-24 pt-10">
      <p>Logging out... Please hold...</p>
    </main>
  );
}
