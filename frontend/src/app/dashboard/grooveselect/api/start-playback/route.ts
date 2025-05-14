import { type NextRequest } from 'next/server'

// Query spotify for next playlist tracks
export async function PUT(request: NextRequest) {
  // Parse header data 
  const requestHeaders = new Headers(request.headers)
  const auth: any = await requestHeaders.get('Authorization')
  // Parse Body Data
  const bodyJSON = await request.json()
  const reqBody = {
    "context_uri": bodyJSON['playlistURI'],
    "offset": {
      "position": bodyJSON['offset']
    },
    "position_ms": 0
  }
  // Query
  const playbackStartRes = await (await fetch("https://api.spotify.com/v1/me/player/play", {
    method: "PUT",
    credentials: "include",
    cache: 'no-cache',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': auth,
    },
    body: JSON.stringify(reqBody)
  }))
  console.log(playbackStartRes)
  // Return success code
  return new Response(`Playing track from playlist URI: ${bodyJSON['playlistURI']} with offset ${bodyJSON['offset']}`, {
    status: await playbackStartRes.status,
  })
}