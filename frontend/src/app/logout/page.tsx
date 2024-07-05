'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation'

export default async function Page() {
  const router = useRouter();


  // NOTE: We make use of the call in this page because it needs to run on the client in order to log the user out
  useEffect(() => {
    const doDiscordLogout = async () => {
      const tokenRevokeResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/discordapi/logout`, {
        method: "GET",
        credentials: "include",
        cache: 'no-cache',
      });
      console.log("Logout completed, redirecting...");
      router.push("/");
    }
    doDiscordLogout()
  }, []);


  return (
    <main className="flex min-h-screen flex-col items-center p-24 pt-10">
      <p className="static w-auto p-5 flex flex-col justify-center rounded-xl border-b bg-gradient-to-b from-zinc-200 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit border bg-gray-200  lg:dark:bg-zinc-800/30">
        Logging out... Please hold...
      </p>
    </main>
  );
}
