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
      <p>Logging out... Please hold...</p>
    </main>
  );
}
