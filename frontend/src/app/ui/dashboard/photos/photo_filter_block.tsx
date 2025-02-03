"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import UserDropdown from "@/app/ui/general/userUiItems/user_dropdown";


// Block to filter photoshops by various criteria
export default function PhotoFilterBlock(props) {
  // Get Router
  const router = useRouter();
  // Filtering Variable States
  const [uploader, setUploader] = useState("");
  const [artist, setArtist] = useState("");
  const [tagged, setTagged] = useState<string[]>([""])

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


  return (
    <div className={`w-3/4 px-2 py-2 my-2 rounded-2xl bg-zinc-800/30 border border-neutral-800`}>
      <div className="flex gap-4">
        <UserDropdown 
          label="Uploader"
          placeholder="Filter by uploader"
          setSelectionCallback={setUploader}
          useNicknameKeys
          selectedKeys={[props.uploader]}
        />
        <UserDropdown 
          label="Artist"
          placeholder="Filter by Artist"
          setSelectionCallback={setArtist}
          useNicknameKeys
          selectedKeys={[props.artist]}
        />
        {/* <UserDropdown 
          label="Tagged"
          placeholder="Filter by Tagged Users"
          isMultipleChoice={true}
          setSelectionCallback={setTagged}
          useNicknameKeys
        /> */}
      </div>
    </div>
  );
}