"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import UserDropdown from "@/app/ui/general/userUiItems/user_dropdown";
import { Button } from "@heroui/react";
import Link from "next/link";


// Block to filter photoshops by various criteria
// Expected Props:
// - uploaderList: List - List of Discord IDs to populate the uplaoder list
// - artistList: List - List of Discord IDs to populate the artist list
export default function PhotoFilterBlock(props) {
  // Get Router
  const router = useRouter();
  // Filtering Variable States
  const [uploader, setUploader] = useState("");
  const [artist, setArtist] = useState("");
  const [tagged, setTagged] = useState<string[]>([""])

  // Push new route on user if they change filters
  useEffect(() => {
    let newURL = "/dashboard/photos?"

    if(Object.values(uploader)[0] != undefined) {
      newURL += `uploader=${Object.values(uploader)[0]}`
    }
    if(Object.values(artist)[0] != undefined) {
      newURL += `&artist=${Object.values(artist)[0]}`
    }
    if((Object.values(tagged)[0] as string) != "") {
      newURL += `&tagged=${Array.from(tagged).join(",")}`
    }
    // Redirect to new url
    router.push(newURL)
  }, [uploader, artist, tagged])

  // Reset all filters
  const handleReset = () => {
    setUploader("")
    setArtist("")
    setTagged([""])
  }


  return (
    <div className={`w-full 2xl:w-3/4 px-2 py-2 my-2 rounded-2xl bg-zinc-800/30 border border-neutral-800`}>
      <div className="flex flex-col lg:flex-row gap-4">
        <UserDropdown 
          label="Uploader"
          placeholder="Filter by uploader"
          setSelectionCallback={setUploader}
          useNicknameKeys
          selectedKeys={[props.uploader]}
          idListOverride={props.uploaderList}
          description={"Filter photos by uploader."}
        />
        <UserDropdown 
          label="Artist"
          placeholder="Filter by Artist"
          setSelectionCallback={setArtist}
          useNicknameKeys
          selectedKeys={[props.artist]}
          idListOverride={props.artistList}
          description={"Filter photos by artist."}
        />
        {/* <UserDropdown 
          label="Tagged"
          placeholder="Filter by Tagged Users"
          isMultipleChoice={true}
          setSelectionCallback={setTagged}
          useNicknameKeys
        /> */}
        <Button 
          as={Link}
          href={'/dashboard/photos'}
          radius="lg"
          className="p-3 mt-[6px] text-sm text-inheret w-fit min-h-0 h-fit bg-gradient-to-br from-green-700 to-green-800 hover:underline" 
          variant="solid"
          onClick={handleReset}
        >
          Reset
        </Button>
      </div>
    </div>
  );
}