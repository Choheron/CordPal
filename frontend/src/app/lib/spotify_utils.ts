"use server"

import { cookies } from "next/headers";

// Below Code allows for serverside computing of cookie stuff!
const getCookie = async (name: string) => {
  return cookies().get(name)?.value ?? '';
}

// 
// Determine if a user has connected their spotify, and return boolean.
// - RETURN: Boolen indicating spotify verification status
//
export async function isSpotifyLinked() {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Validate that user has connected spotify
  console.log("isSpotifyLinked: Sending request to backend '/spotifyapi/connected'")
  const spotLinkedResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/spotifyapi/connected`, {
    method: "GET",
    credentials: "include",
    cache: 'no-cache',
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    }
  });
  const isSpotifyConnected: boolean = (await spotLinkedResponse.json())['connected'];
  return isSpotifyConnected;
}

// 
// Retrieve user data from backend relating to spotify.
// - RETURN: JSON Objects 
//
export async function getSpotifyData() {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Validate that user has connected spotify
  console.log("getSpotifyData: Sending request to backend '/spotifyapi/getSpotifyData'")
  const spotifyUserData = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/spotifyapi/getSpotifyData`, {
    method: "GET",
    credentials: "include",
    cache: 'force-cache',
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    }
  });
  return await spotifyUserData.json();
}

// 
// Retrieve top items from passed in params.
// - RETURN: JSON Objects 
//
export async function getSpotifyTopItems(type, time_range, limit, offset) {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Validate that user has connected spotify
  console.log("getSpotifyData: Sending request to backend '/spotifyapi/getTopItems'")
  const spotifyTopItemsResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/spotifyapi/getTopItems/${type}/${time_range}/${limit}/${offset}`, {
    method: "GET",
    credentials: "include",
    cache: 'force-cache',
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    }
  });
  return await spotifyTopItemsResponse.json();
}