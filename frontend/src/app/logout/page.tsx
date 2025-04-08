'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation'
import { logout } from '../lib/user_utils';

export default function Page() {
  const router = useRouter();


  // NOTE: We make use of the call in this page because it needs to run on the client in order to log the user out
  useEffect(() => {
    const doDiscordLogout = async () => {
      await logout()
    }
    doDiscordLogout()
    router.push("/");
  }, []);


  return (
    <main className="flex flex-col items-center p-24 pt-10">
      <p className="static w-auto p-5 flex flex-col justify-center rounded-xl border-b bg-gradient-to-b backdrop-blur-2xl border-neutral-800 bg-zinc-800/30 from-inherit border bg-gray-200  lg:bg-zinc-800/30">
        Logging out... Please hold...
      </p>
    </main>
  );
}
