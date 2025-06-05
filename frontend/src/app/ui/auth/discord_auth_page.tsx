// app/auth/discord-auth-page.tsx
'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function DiscordAuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const doDiscordHandshake = async () => {
      const reqData = {
        code: code,
        redirect_uri: process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI,
      };
      console.log(reqData);

      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL_CLIENT}/discordapi/token`, {
        method: 'POST',
        body: JSON.stringify(reqData),
        credentials: 'include',
        cache: 'no-store',
      });

      console.log("Auth completed, redirecting...");
      router.push("/");
    };

    doDiscordHandshake();
  }, [searchParams]);

  return (
    <main className="flex flex-col items-center p-24 pt-10">
      <p className="static w-auto p-5 flex flex-col justify-center rounded-xl border-b bg-gradient-to-b backdrop-blur-2xl border-neutral-800 bg-zinc-800/30 from-inherit border bg-gray-200  lg:bg-zinc-800/30">
        Retrieving discord data... please hold...
      </p>
    </main>
  );
}
