import { type NextRequest } from 'next/server'

// Query spotify for next playlist tracks
export async function GET(request: NextRequest) {
  // Parse data 
  const requestHeaders = new Headers(request.headers)
  const queryUrl = await requestHeaders.get('queryurl')
  const auth = await requestHeaders.get('Authorization')
  // Query
  const playlistResJSON = await (await fetch(queryUrl, {
    method: "GET",
    credentials: "include",
    next: { revalidate: 300 },
    headers: {
      'Content-Type': 'application/json',
      'Authorization': auth,
    },  
  })).json();
  // Return success code
  return Response.json({ data: playlistResJSON })
}