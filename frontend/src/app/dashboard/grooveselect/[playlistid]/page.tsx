"use server"

import { getSpotifyBearerToken } from "@/app/lib/spotify_utils"
import SwipePage from "../ui/swipe-page"
import PageTitle from "@/app/ui/dashboard/page_title"

export default async function Page({
  params,
}: {
  params: Promise<{ playlistid: string }>
}) {
  // Retrieive prop of playlistid from url
  const playlistid = (await params).playlistid
  // Get bearer token
  const bearer_token = await getSpotifyBearerToken()
  // Get user profile data
  const userDataJSON = await (await fetch(`https://api.spotify.com/v1/me`, {
    method: "GET",
    credentials: "include",
    next: { revalidate: 300 },
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${bearer_token}`,
    },  
  })).json();
  // Retrieve playlist data 
  const playlistResJSON = await (await fetch(`https://api.spotify.com/v1/playlists/${playlistid}`, {
    method: "GET",
    credentials: "include",
    next: { revalidate: 300 },
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${bearer_token}`,
    },  
  })).json();


  return (
    <div className="pt-10">
      <PageTitle text={`[WIP] Editing "${playlistResJSON['name']}" [WIP]`} />
      <SwipePage
        userData={userDataJSON}
        playlistObj={playlistResJSON}
        bearerToken={bearer_token}
      />
    </div>
  )
}