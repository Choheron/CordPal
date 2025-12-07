'use server'

import "@/app/globals.css";

import { Alert } from "@heroui/alert";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";

import { verifyAuth } from "./lib/discord_utils";
import { redirect } from "next/navigation";
import AboutBlock from "./ui/about/about_block";
import LoginModal from "./ui/login_modal";
import { Conditional } from "./ui/dashboard/conditional";

export default async function Home({ searchParams }) {
  const { params } = await searchParams
  // Check if the redirect param exists
  const redirectReason = params?.redirect
  // If user already has a session code/is already logged in, then redirect them to the dashboard page
  if((await verifyAuth())['valid']) {
    redirect('/dashboard');
  }
  if(redirectReason) {
    
  }

  return (
    <main className="flex max-w-full flex-col items-center justify-top pt-16 pb-32 lg:p-24 lg:mb-0">
      <div className="flex mb-10 z-10 w-full max-w-5xl items-center justify-between font-mono text-sm">
        <div className="fixed left-0 top-0 flex w-full justify-center border-b pb-6 pt-8 backdrop-blur-2xl border-neutral-800 bg-zinc-800/30 from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:bg-zinc-800/30">
          <div>
            <p>Login with:</p>
            <div className="flex flex-col gap-1 font-extralight">
              <Link
                href={process.env.NEXT_PUBLIC_DISCORD_AUTH_URL}
              >
                <Button
                  radius="lg"
                  className={`w-fit hover:underline bg-black`}
                  variant="solid"
                >
                  <img 
                    src={"/images/branding/Discord-Logo-Blurple.svg"}
                    width={100}
                    height="auto"
                    className="p-2"
                  />
                </Button>
              </Link>
              <LoginModal 
                isDisabled={(redirectReason == "DIS") ? true : false}
              />
            </div>
          </div>
        </div>
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
      <Conditional showWhen={(redirectReason == "DIS")}>
        <Alert 
          title={`Login Failed! See Details`}
          description={`Your discord token is expired, please authenticate with discord once again to be able to do traditional authentication once more.`}
          color="danger"
          variant="bordered"
          className="my-2"
        />
      </Conditional>
      <AboutBlock loggedIn={false} />
    </main>
  );
}
