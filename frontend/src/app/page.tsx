'use server'

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
    <main className="flex min-h-screen flex-col items-center justify-top p-24">
      <div className="flex mb-10 z-10 w-full max-w-5xl items-center justify-between font-mono text-sm">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          Login with&nbsp;
          <a href={process.env.NEXT_PUBLIC_DISCORD_AUTH_URL} className="font-mono font-bold underline"><i>Discord</i></a>
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
      <div className="static w-auto p-5 flex flex-col justify-center rounded-xl border-b bg-gradient-to-b from-zinc-200 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit border bg-gray-200  lg:dark:bg-zinc-800/30">
        <h2 className="text-3xl italic">
					Welcome to the Nanophage Discord Site!
				</h2>
				<hr/>
				<div className="max-w-7xl pt-2 pl-1">
					<p className="pl-2">
						This site runs on my homelab! For more information around homelabs and self-hosting, check out the following:
					</p>
					<ul className="list-disc pl-10 text-sm">
						<li><a href="https://www.reddit.com/r/homelab/" className="text-blue-600 dark:text-blue-500 hover:underline">Homelab Subreddit</a></li>
						<li><a href="https://www.reddit.com/r/selfhosted/" className="text-blue-600 dark:text-blue-500 hover:underline">SelfHosted Subreddit</a></li>
						<li><a href="https://github.com/awesome-selfhosted/awesome-selfhosted" className="text-blue-600 dark:text-blue-500 hover:underline">Awesome Selfhosted</a></li>
					</ul>
					<h3 className="text-2xl italic pt-1">
						What is this website?
					</h3>
					<p className="pl-2">
						This website serves as a frontend for a collection of data on a discord server with a group of my friends. It also serves as a form of a frontend for a discord bot that also runs on this homelab. I created that discord bot as a way to track user quotes and 
						create other fun commands to play with. Users of certian servers (<i>Currently just the one</i>) can click "Login with Discord" and access data from the discord bot, as well as see other related information. If you click on this link and are not a member of the server, you will
						just be greeted with some user data and a little message that asks you why you are here.
					</p>
					<h3 className="text-2xl italic pt-1">
						What can the website do? Do you have further plans?
					</h3>
					<p className="pl-2">
						This website currently does lots of inside joke-y things. It displays quote data from users in the discord, it has a page showing photoshops we have done, and it has a todo page. I plan on expanding and adding new functionality as I come up with it! Eventually I would like to 
						expand the functionality to allow for use across multiple discords and perhaps allow mutli-user sign up, if I ever reached that point.
					</p>
					<p className="w-full text-center italic">
						But until then, its just a fun side project!
					</p>
					<h3 className="text-2xl italic pt-1">
						How is it set up?
					</h3>
					<div className="pl-2">
						<p>
							Currently, this site consists of two main compute instances and one side instance (Hard to give it a label). 
						</p>
						<ol className="list-decimal pl-10">
							<li>A Frontend running on <a href="https://nextjs.org/" className="text-blue-600 dark:text-blue-500 hover:underline">NextJS</a></li>
							<li>A Backend running on <a href="https://www.djangoproject.com/" className="text-blue-600 dark:text-blue-500 hover:underline">Django</a></li>
							<li>A Discord Bot written in <a href="https://www.python.org/" className="text-blue-600 dark:text-blue-500 hover:underline">Python</a></li>
						</ol>
						<p>
							The two main instances handle the serving of the frontend and the handling/tranforming/retrieval of data from a (currently) in memory database on the backend, via an api layer. The third compute instance runs the discord bot that users can interact with, within the server. All of these
							instances are containerized and self-hosted so that I can have full control over the process and learn as much as possible.
						</p>
					</div>
					<h3 className="text-2xl italic pt-1">
						Who are you?
					</h3>
					<p className="pl-2">
						My name is <a href="https://thomascampbell.dev/" className="text-blue-600 dark:text-blue-500 hover:underline">Thomas Campbell</a>! I am a DevOps Engineer with a passion for coding and creating things.
					</p>
				</div>
      </div>
    </main>
  );
}
