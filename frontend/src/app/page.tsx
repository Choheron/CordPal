"use server"

import Link from "next/link";
import "@/app/globals.css";
import { verifyAuth } from "./lib/discord_utils";
import { redirect } from "next/navigation";

export default async function Home() {
  // If user already has a session code/is already logged in, then redirect them to the dashboard page
  if(await verifyAuth()) {
    redirect('/dashboard');
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          Login with&nbsp;
          <a href={process.env.DISCORD_AUTH_URL} className="font-mono font-bold underline"><i>Discord</i></a>
        </p>
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:size-auto lg:bg-none">
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
    </main>
  );
}
