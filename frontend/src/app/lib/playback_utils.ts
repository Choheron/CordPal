"use server"

import { revalidateTag, updateTag } from "next/cache";
import { cookies } from "next/headers";

// Below Code allows for serverside computing of cookie stuff!
const getCookie = async (name: string) => {
  return (await cookies()).get(name)?.value ?? '';
}


// 
// Determine if CordPal Playback is available for the passed in params.
// - RETURN: Boolen indicating availability
//
export async function isPlaybackAvailable(year, user_discord_id = null) {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Create URL tail
  const urlTail = (user_discord_id) ? `${year}/${user_discord_id}` : `${year}`
  // Check if playback is available
  console.log(`isPlaybackAvailable: Sending request to backend '/playback/isPlaybackAvailable/${urlTail}'`)
  const playbackAvailableResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/playback/isPlaybackAvailable/${urlTail}`, {
    method: "GET",
    credentials: "include",
    cache: 'force-cache',
    next: { tags: [`playbackAvailable`, `playback_${year}`] },
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    }
  });
  const avail: boolean = (await playbackAvailableResponse.json())['available'];
  return avail;
}


// 
// Retrieve site-wide CordPal Playback Data
// - RETURN: JSON Containing CordPal Playback Data
//
export async function getGlobalPlaybackData(year) {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Check if playback is available
  console.log(`isPlaybackAvailable: Sending request to backend '/playback/getGlobalPlaybackData/${year}'`)
  const globalPlaybackDataResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/playback/getGlobalPlaybackData/${year}`, {
    method: "GET",
    credentials: "include",
    cache: 'force-cache',
    next: { tags: [`playback_${year}`] },
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    }
  });
  const globalPlaybackData: Object = (await globalPlaybackDataResponse.json());
  return globalPlaybackData;
}