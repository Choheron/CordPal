'use server'

import "@/app/globals.css";
import { verifyAuth } from "./lib/discord_utils";
import { redirect } from "next/navigation";
import AboutBlock from "./ui/about/about_block";

export default async function Home() {
  // If user already has a session code/is already logged in, then redirect them to the dashboard page
  if(await verifyAuth()) {
    redirect('/dashboard');
  }

  return (
    <main className="flex min-h-screen max-w-full flex-col items-center justify-top pt-16 pb-32 lg:p-24 lg:mb-0">
      <div className="flex mb-10 z-10 w-full max-w-5xl items-center justify-between font-mono text-sm">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b pb-6 pt-8 backdrop-blur-2xl border-neutral-800 bg-zinc-800/30 from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:bg-zinc-800/30">
          Login with&nbsp;
          <a href={process.env.NEXT_PUBLIC_DISCORD_AUTH_URL} className="font-mono font-bold underline hover:italic">Discord</a>
        </p>
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-black via-black lg:static lg:size-auto lg:bg-none">
          {/* <a
            className="pointer-events-none flex place-items-center gap-2 p-8 lg:pointer-events-auto lg:p-0"
            href="https://homelab.nanophage.win"
            target="_blank"
            rel="noopener noreferrer"
          > */}
            By{" "}
            Nanophage
          {/* </a> */}
        </div>
      </div>
      <AboutBlock loggedIn={false} />
    </main>
  );
}
