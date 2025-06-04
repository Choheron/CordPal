// app/auth/page.tsx
'use client'

import { Suspense } from 'react'
import DiscordAuthPage from '../ui/auth/discord_auth_page';


export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <DiscordAuthPage />
    </Suspense>
  )
}

function Loading() {
  return (
    <main className="flex flex-col items-center p-24 pt-10">
      <p className="static w-auto p-5 flex flex-col justify-center rounded-xl border-b bg-gradient-to-b backdrop-blur-2xl border-neutral-800 bg-zinc-800/30 from-inherit border bg-gray-200  lg:bg-zinc-800/30">
        Loading...
      </p>
    </main>
  );
}
