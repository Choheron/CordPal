"use server"
import { redirect } from 'next/navigation';

import { getGlobalPlaybackData, isPlaybackAvailable } from "@/app/lib/playback_utils"
import Link from 'next/link';
import { RiArrowDownLine, RiCloseCircleLine, RiHome2Fill } from 'react-icons/ri';
import GlobalAotdPlayback from '@/app/ui/playback/global_aotd_playback';
import GlobalReviewPlayback from '@/app/ui/playback/global_review_playback';

import { BBH_Sans_Bartle } from 'next/font/google'
import GlobalReviewReactionPlayback from '@/app/ui/playback/global_review_reaction_playback';
import GlobalPhotoPlaybackData from '@/app/ui/playback/global_photos_playback';
import GlobalQuotesPlayback from '@/app/ui/playback/global_quotes_playback';
// Setup Font
const bartle = BBH_Sans_Bartle({weight: "400"})

export default async function page({
  params,
}: {
  params: Promise<{ year: number }> 
}) {
  // Parse year from URL
  const { year } = (await params)
  // Check if Playback is available for this year, if not, redirect to dashboard
  const available = await isPlaybackAvailable(year)
  if(!available) {
    redirect("/dashboard/aotd")
  }
  // Get site-wide playback data
  const playbackData = await getGlobalPlaybackData(year)
  // Animated background tailwind
  const animatedGradientTW = "animate-gradient-move bg-size-200 bg-gradient-to-tr from-violet-700 from-30% via-violet-800 via-50% to-violet-700 to-80%"

  // Home button
  const homeButton = () => {
    return (
      <a
        href="#home"
      >
        <div className="group border-2 w-fit p-1 rounded-xl hover:bg-white/50">
          <RiHome2Fill className="text-2xl group-hover:text-black" />
        </div>
      </a>
    )
  }


  return (
    <>
      {/* If user is on mobile, tell them off */}
      <div className={`sm:hidden ${animatedGradientTW}`}>
        <div className={`w-full z-10 h-[100vh] relative flex align-middle items-center snap-start ${bartle.className}`}>
          <div className="mx-auto">
            <p className="mx-auto text-xl">CordPal Playback</p>
            <p className="text-right text-lg text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-green-500 to-indigo-400">{playbackData['year']}</p>
            <p className="text-xs w-full text-center">
              Not available on mobile
            </p>
            <div className="w-fit mx-auto">
              <Link
                href="/dashboard/aotd"
                className="p-1 border-gray-600 group hover:bg-gray-400 flex rounded-2xl"
              >
                <RiCloseCircleLine className="text-2xl" />
              </Link>
            </div>
          </div>
        </div>
      </div>
      {/* Cordpal Playback! */}
      <div className={`hidden sm:block w-full relative overflow-y-scroll h-screen snap-y snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${animatedGradientTW}`}>
        {/* Home Button */}
        <div id="home" className="absolute top-2 left-2 z-50">
          <Link
            href="/dashboard/aotd"
            className="p-2 border-2 border-gray-600 bg-gray-900 group hover:bg-gray-400 flex rounded-2xl"
          >
            <RiCloseCircleLine className="text-2xl group-hover:text-black" />
          </Link>
        </div>
        {/* Welcome Page */}
        <div className={`w-full z-10 h-[100vh] relative flex align-middle items-center snap-start ${bartle.className}`}>
          <div className="mx-auto">
            <p>Welcome to </p>
            <p className="mx-auto text-5xl">CordPal Playback</p>
            <p className="text-right text-6xl text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-green-500 to-indigo-400">{playbackData['year']}</p>
          </div>
          {/* Navigation Menu */}
          {/* Bouncing Arrow */}
          <div className="absolute bottom-0 left-[50%]">
            <RiArrowDownLine className="mx-auto animate-bounce"/>
            <p>Scroll</p>
          </div>
        </div>
        {/* AOTD Page */}
        <div id="aotd" className="w-full h-[100vh] relative flex snap-start">
          {/* Headers */}
          <div className={`absolute top-2 left-2 text-2xl ${bartle.className}`}>
            <p>Album Of The Day</p>
            {homeButton()}
          </div>
          <div className={`absolute top-2 right-2 text-2xl ${bartle.className}`}>
            <p>CordPal Playback</p>
            <p className='text-right text-3xl text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-green-500 to-indigo-400'>{year}</p>
          </div>
          {/* Data Display */}
          <GlobalAotdPlayback aotdPlaybackData={playbackData['payload']['aotd']} />
        </div>
        {/* Reviews Page */}
        <div id="reviews" className="w-full h-[100vh] relative flex align-middle items-center snap-start">
          {/* Headers */}
          <div className={`absolute top-2 left-2 text-2xl ${bartle.className}`}>
            <p>Album Reviews</p>
            {homeButton()}
          </div>
          <div className={`absolute top-2 right-2 text-2xl ${bartle.className}`}>
            <p>CordPal Playback</p>
            <p className='text-right text-3xl text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-green-500 to-indigo-400'>{year}</p>
          </div>
          {/* Data Display */}
          <GlobalReviewPlayback reviewPlaybackData={playbackData['payload']['reviews']} />
        </div>
        {/* Review Reactions Page */}
        <div id="review_reactions" className="w-full h-[100vh] relative flex align-middle items-center snap-start">
          {/* Headers */}
          <div className={`absolute top-2 left-2 text-2xl ${bartle.className}`}>
            <p>Review Reactions</p>
            {homeButton()}
          </div>
          <div className={`absolute top-2 right-2 text-2xl ${bartle.className}`}>
            <p>CordPal Playback</p>
            <p className='text-right text-3xl text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-green-500 to-indigo-400'>{year}</p>
          </div>
          {/* Data Display */}
          <GlobalReviewReactionPlayback reviewReactPlaybackData={playbackData['payload']['review_reactions']}/>
        </div>
        {/* Photos Page */}
        <div id="photos" className="w-full h-[100vh] relative flex align-middle items-center snap-start">
          {/* Headers */}
          <div className={`absolute top-2 left-2 text-2xl ${bartle.className}`}>
            <p>Photoshops</p>
            {homeButton()}
          </div>
          <div className={`absolute top-2 right-2 text-2xl ${bartle.className}`}>
            <p>CordPal Playback</p>
            <p className='text-right text-3xl text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-green-500 to-indigo-400'>{year}</p>
          </div>
          {/* Data Display */}
          <GlobalPhotoPlaybackData photoPlaybackData={playbackData['payload']['photos']} />
        </div>
        {/* Quotes Page */}
        <div id="quotes" className="w-full h-[100vh] relative flex align-middle items-center snap-start">
          {/* Headers */}
          <div className={`absolute top-2 left-2 text-2xl ${bartle.className}`}>
            <p>Quotes</p>
            {homeButton()}
          </div>
          <div className={`absolute top-2 right-2 text-2xl ${bartle.className}`}>
            <p>CordPal Playback</p>
            <p className='text-right text-3xl text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-green-500 to-indigo-400'>{year}</p>
          </div>
          {/* Data Display */}
          <GlobalQuotesPlayback quotePlaybackData={playbackData['payload']['quotes']} />
        </div>
      </div>
    </>
  )
}