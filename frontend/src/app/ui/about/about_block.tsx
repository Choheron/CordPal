import { Conditional } from "../dashboard/conditional";
import Image from 'next/image';
import AboutAccordion from "./about_accordion";
import { Divider } from "@heroui/divider";


// Display an about page
// Expected Props:
//  - loggedIn: Boolean -> Is the user logged in or not
export default async function AboutBlock(props) {
  const loggedIn: boolean = props["loggedIn"];
  
  return (
    <div className="max-w-7xl w-auto md:w-full p-5 flex flex-col justify-center rounded-xl border-b bg-gradient-to-b backdrop-blur-2xl border-neutral-800 bg-zinc-800/30 from-inherit border bg-gray-200  lg:bg-zinc-800/30">
      <h2 className="text-3xl italic">
        Welcome to CordPal!
      </h2>
      <hr/>
      <div className="max-w-7xl pt-2 pl-1">
        <p className="pl-2">
          This site runs on my homelab! For more information around homelabs and self-hosting, check out the following:
        </p>
        <ul className="list-disc pl-10 text-sm">
          <li><a href="https://www.reddit.com/r/homelab/" className="text-blue-500 hover:underline">Homelab Subreddit</a></li>
          <li><a href="https://www.reddit.com/r/selfhosted/" className="text-blue-500 hover:underline">SelfHosted Subreddit</a></li>
          <li><a href="https://github.com/awesome-selfhosted/awesome-selfhosted" className="text-blue-500 hover:underline">Awesome Selfhosted</a></li>
        </ul>
        <Conditional showWhen={!loggedIn}>
          <h3 className="text-2xl italic pt-1">
            What is this website?
          </h3>
          <p className="pl-2">
            This website serves as a frontend for a collection of data on a discord server with a group of my friends. It also serves as a form of a frontend for a discord bot that also runs on this homelab. I created that discord bot as a way to track user quotes and 
            create other fun commands to play with. Users of certain servers (<i>Currently just the one</i>) can click &quot;Login with Discord&quot; and access data from the discord bot, as well as see other related information. If you click on this link and are not a member of the server, you will
            just be greeted with some user data and a little message that asks you why you are here.
          </p>
        </Conditional>
        <h3 className="text-2xl italic pt-1">
          What can the website do? Do you have further plans?
        </h3>
        <p className="pl-2">
          This website currently does lots of inside joke-y things.
        </p>
        <AboutAccordion />
        <p className="w-full text-center italic">
          If this becomes something larger, so be it. But until then, its just a fun side project!
        </p>
        <h3 className="text-2xl italic pt-1">
          How is it set up?
        </h3>
        <div className="pl-2">
          <p>
            Currently, this site consists of two main compute instances and one side instance (Hard to give it a label). 
          </p>
          <ol className="list-decimal pl-10">
            <li>A Frontend running on <a href="https://nextjs.org/" className="text-blue-500 hover:underline">NextJS</a></li>
            <li>A Backend running on <a href="https://www.djangoproject.com/" className="text-blue-500 hover:underline">Django</a></li>
            <li>A Cron-Manager container running on <a href="https://alpinelinux.org/" className="text-blue-500 hover:underline">Alpine</a></li>
            <li>A <a href="https://www.postgresql.org/" className="text-blue-500 hover:underline">Postgresql</a> Database</li>
            <li>A Discord Bot written in <a href="https://www.python.org/" className="text-blue-500 hover:underline">Python</a></li>
          </ol>
          <p>
            The two main instances handle the serving of the frontend and the handling/tranforming/retrieval of data from a (currently) in memory database on the backend, 
            via an api layer. The third compute instance runs the discord bot that users can interact with, within the server. You may ask me, why use a cron manager and 
            not the host crontab? Great question! The issue is that currently all of these containers run on my UNRAID server, which can be a little finicky with user crons.
            Also, eventually I would like to migrate this site to a selfhosted k8s cluster, so by having a written out crontab I can migrate to K8s with more ease. All of these
            instances are containerized and self-hosted so that I can have full control over the process and learn as much as possible. Below is a simplified infra diagram:
          </p>
          <Conditional showWhen={loggedIn}>
            <div className="w-full flex justify-center">
              <Image
                src="/InfraDiagram.Aug2024.svg"
                width={500}
                height={500}
                alt="Picture of the author"
                className="rounded-lg"
              />
            </div>
          </Conditional>
        </div>
        <h3 className="text-2xl italic pt-1">
          Who am I?
        </h3>
        <p className="pl-2">
          My name is <a href="https://thomascampbell.dev/" className="text-blue-500 hover:underline">Thomas Campbell</a>! I am passionate about creating 
          things and learning as much as I can!
        </p>
        <Divider className="mt-2 mb-1"/>
        <h3 className="text-2xl italic pt-1">
          3rd Party Attributions:
        </h3>
        <p className="pl-2">
          A special thanks to all 3rd party libraries and APIs that make this website possible as a passion project. Libraries and APIs listed below:
        </p>
        <ul className="list-disc pl-10 text-sm">
          <li><a href="https://nextjs.org/" className="text-blue-500 hover:underline">NextJS</a> - Frontend</li>
          <li><a href="https://nextui.org/" className="text-blue-500 hover:underline">NextUI</a> - Frontend UI library to make my life as a DevOps guy easier</li>
          <li><a href="https://remixicon.com/" className="text-blue-500 hover:underline">RemixIcons</a> - Open source icons.</li>
          <li><a href="https://tiptap.dev/" className="text-blue-500 hover:underline">TipTap</a> - Rich text editor, made it much easier to implement rich text editing for users.</li>
          <li><a href="https://rosencharts.com/" className="text-blue-500 hover:underline">Rosen Charts</a> - SSR Chart Library that is extremely easily extensible.</li>
          <li>
            <a href="https://developer.spotify.com/documentation/web-api" className="text-blue-500 hover:underline">Spotify API</a> - All songs and artist related 
            media is property of spotify and/or the respective artist.
          </li>
          <li><a href="https://discord.com/developers/docs/intro" className="text-blue-500 hover:underline">Discord API</a> - The start of the whole project.</li>
          
        </ul>
      </div>
    </div>
  );
}