'use client'

import { redirect } from 'next/navigation'
import { useEffect } from 'react';
import { useRouter } from 'next/navigation'


export default async function Page({ searchParams, }: { searchParams: { [key: string]: string | string[] | undefined }; }) {
  const router = useRouter();
  const code = searchParams["code"] ?? "NO CODE";
  // Redirect user to login page if code is bad
  if(code == "NO CODE") {
    redirect('/')
  }

  useEffect(() => {
    const doDiscordHandshake = async () => {
      // Do Auth Handshake...
      const reqData = {
      'code': code,
      'redirect_uri': process.env.NEXT_PUBLIC_REDIRECT_URI,
      }
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL_CLIENT}/discordapi/token`, {
        method: "POST",
        body: JSON.stringify(reqData),
        credentials: "include",
        cache: 'no-store',
      });
      console.log("Auth completed, redirecting...");
      router.push("/dashboard");
    }
    doDiscordHandshake()
  }, []);


  return (
    <main className="flex min-h-screen flex-col items-center p-24 pt-10">
      <p>Retrieving discord data... please hold...</p>
    </main>
  );
}
