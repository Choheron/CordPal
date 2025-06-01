'use client'

import { enrollAotdUser } from "@/app/lib/aotd_utils";
import {Divider} from "@heroui/divider";
import { Button } from "@heroui/react";


export default async function AotdEnrollBox(props) {

  const handleButton = async() => {
    await enrollAotdUser()
  }


  return (
    <div className="flex flex-col w-11/12 sm:w-2/5 rounded-xl mb-3 py-2 px-2  backdrop-blur-2xl bg-zinc-800/30 border border-neutral-800">
      <p className="mx-auto text-center">In order to view your personalized spotify data:</p>
      <div className="flex flex-col md:flex-row justify-center mx-auto">
        <Button
          onPress={handleButton}
        >
          Enroll in Album of the Day
        </Button>
      </div>
      <Divider className="my-2" />
      <p className="mx-auto text-center text-sm">
        EXPLAIN AOTD HERE 
      </p>
    </div>
  )
}