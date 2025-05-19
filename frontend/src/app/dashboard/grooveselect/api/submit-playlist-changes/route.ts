import { type NextRequest } from 'next/server'

// Start process of deletion of songs from a playlist
export async function POST(request: NextRequest) {
  // Parse header data 
  const requestHeaders = new Headers(request.headers)
  const auth: any = await requestHeaders.get('Authorization')
  // Parse Body Data
  const bodyJSON = await request.json()
  const playlistId = bodyJSON['playlist_id']
  const reqBody = {
    "tracks": bodyJSON['trackURIs'],
    "snapshot_id": bodyJSON['snapshot_id']
  }
  // Query
  const deleteRes = await (await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
    method: "DELETE",
    credentials: "include",
    cache: 'no-cache',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': auth,
    },
    body: JSON.stringify(reqBody)
  }))
  // Return success code
  return new Response(`Playing track from playlist URI: ${bodyJSON['playlistURI']} with offset ${bodyJSON['offset']}`, {
    status: await deleteRes.status,
  })
}