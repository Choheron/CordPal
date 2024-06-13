import Link from "next/link";
import { cookies } from "next/headers";
import { Conditional } from "./conditional";
import { isMember } from "@/app/lib/discord_utils";

export default async function TopBar(props) {

  return (
    <div className="flex flex-col items-center justify-between p-24 pb-10">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          Welcome {props.userInfo['global_name']}!
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
      <div className="z-10 w-full max-w-5xl items-center justify-around font-mono text-sm lg:flex pt-5">
        <Link href="/dashboard">Home</Link>
        <Conditional showWhen={await isMember()}><Link href="/dashboard/photos">Photoshops</Link></Conditional>
      </div>
    </div>
  );
}