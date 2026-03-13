'use client'

import { Button } from "@heroui/button";
import { enrollAotdUser } from "@/app/lib/aotd_utils";
import { Divider } from "@heroui/divider";
import { useRouter } from "next/navigation";
import { RiMusicFill, RiCalendarCheckFill, RiStarFill, RiShuffleFill } from "react-icons/ri";


export default function AotdEnrollBox(props) {
  const router = useRouter();

  const handleButton = () => {
    const enroll = async () => {
      await enrollAotdUser()
    }
    enroll()
    router.refresh();
  }

  return (
    <div className="flex flex-col w-11/12 sm:w-3/5 lg:w-2/5 rounded-2xl mb-3 py-6 px-6 backdrop-blur-2xl bg-zinc-800/30 border border-neutral-800 gap-4">

      {/* Header */}
      <div className="flex flex-col items-center gap-1 text-center">
        <RiMusicFill className="text-4xl text-green-400 mb-1" />
        <h2 className="text-2xl font-bold tracking-tight">Join Album of the Day</h2>
        <p className="text-sm text-gray-400 max-w-sm">
          Discover new music every day alongside your Discord community — listen, rate, and share your take on one album at a time.
        </p>
      </div>

      {/* Enroll Button */}
      <div className="flex justify-center">
        <Button
          onPress={() => handleButton()}
          className="font-semibold text-white bg-gradient-to-br from-green-700/80 to-green-800/80 px-8"
          radius="lg"
          size="lg"
        >
          Enroll Now
        </Button>
      </div>

      <Divider />

      {/* What is AOTD */}
      <div className="flex flex-col gap-3 px-1">
        <p className="text-base font-semibold text-gray-200">What is Album of the Day?</p>
        <p className="text-sm text-gray-400">
          <strong className="text-gray-200">Album of the Day (AOTD)</strong> is a daily music experience for your Discord server.
          Members submit albums they love, and each day one is chosen at random for everyone to explore together.
          It&apos;s a great way to step outside your usual rotation, rediscover classics, and see what your friends are into.
        </p>

        <div className="flex flex-col gap-3 mt-1">
          <div className="flex gap-3 items-start">
            <RiMusicFill className="text-green-400 text-lg mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-gray-200">Submit albums you love</p>
              <p className="text-xs text-gray-400">
                Build a personal queue of albums for the community to hear. Submissions are powered by the{" "}
                <a href="https://musicbrainz.org/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">MusicBrainz</a>{" "}
                database, ensuring accurate metadata and consistent cover art.
              </p>
            </div>
          </div>

          <div className="flex gap-3 items-start">
            <RiShuffleFill className="text-green-400 text-lg mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-gray-200">A new album every day</p>
              <p className="text-xs text-gray-400">
                Each day, one album from the community pool is selected at random and spotlighted for the entire server to experience together.
              </p>
            </div>
          </div>

          <div className="flex gap-3 items-start">
            <RiStarFill className="text-green-400 text-lg mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-gray-200">Rate, review, and react</p>
              <p className="text-xs text-gray-400">
                Leave a score, write a full review, or just drop a quick reaction — there&apos;s no wrong way to engage.
                The best part is reading everyone else&apos;s take and seeing how perspectives differ.
              </p>
            </div>
          </div>

          <div className="flex gap-3 items-start">
            <RiCalendarCheckFill className="text-green-400 text-lg mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-gray-200">Browse the archive</p>
              <p className="text-xs text-gray-400">
                Every past album and its reviews are preserved in the calendar — so you can always go back to catch up on ones you missed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}