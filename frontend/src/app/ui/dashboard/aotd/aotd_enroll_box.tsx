'use client'

import { Button } from "@heroui/button";

import { enrollAotdUser } from "@/app/lib/aotd_utils";
import { Divider } from "@heroui/divider";
import { useRouter } from "next/navigation";


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
    <div className="flex flex-col w-11/12 sm:w-2/5 rounded-xl mb-3 py-2 px-2  backdrop-blur-2xl bg-zinc-800/30 border border-neutral-800">
      <p className="mx-auto text-center">In order to participate in the Album of the Day, you must formally enroll by clicking the button below:</p>
      <div className="flex flex-col md:flex-row justify-center mx-auto">
        <Button
          onPress={() => handleButton()}
        >
          Enroll in Album of the Day
        </Button>
      </div>
      <Divider className="my-2" />
      <div className="mx-auto text-sm px-5">
        <p className="text-xl">{`What's Album of the Day (AOTD)?`}</p>
        <Divider />
        <p><strong>Album of the Day</strong> is a fun way for music lovers in your discord to share and discover albums together, one day at a time!</p>

        <p className="text-lg">How it works:</p>
        <ul>
          <li><strong>Submit albums you love</strong> - Backed by the the <a href="https://musicbrainz.org/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">MusicBrainz</a> database. It keeps things clean and consistent with proper album info and cover art.</li>
          <li><strong>Every day, we pick one at random</strong></li>
          <li><strong>Everyone can listen and share their thoughts</strong> - whether its a detailed review, a quick reaction, or just a rating. Its all about hearing different perspectives on music.</li>
        </ul>
      </div>
    </div>
  )
}