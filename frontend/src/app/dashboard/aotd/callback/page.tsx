'use client'
import { redirect } from 'next/navigation'
import { useEffect } from 'react';
import { useRouter } from 'next/navigation'
import { use } from "react";

import Image from "next/image";

export default function Callback({params}: {params: Promise<{ code: string }>}) {
  const router = useRouter();
  const { code } = use(params)
  // Redirect user to login page if code is bad
  if(code == "NO CODE") {
    redirect('/')
  }

  useEffect(() => {
    const doSpotifyHandshake = async () => {
      // Do Auth Handshake...
      const reqData = {
        'code': code,
      }
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL_CLIENT}/spotifyapi/token`, {
        method: "POST",
        body: JSON.stringify(reqData),
        credentials: "include",
        cache: 'no-store',
      });
      console.log("Spotify Handshake completed, redirecting...");
      router.push("/dashboard/aotd");
    }
    doSpotifyHandshake()
  }, []);

  return (
    <div className="flex flex-col items-center p-24 pt-10">
      <p>Handling spotify data, please wait...</p>
      <p>Please do not refresh or click off of this page!</p>
      <br />
      <Image
        alt="Cat working at anvil, AI Image"
        width={300}
        height={300}
        src="/images/Cat_Anvil_AI.png"
        style={{ width: 'auto', height: 'auto' }}
        className="rounded-2xl"
      />
    </div>
  );
}