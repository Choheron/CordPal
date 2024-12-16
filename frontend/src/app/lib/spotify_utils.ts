"use server"

import { revalidatePath } from "next/cache";
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
// Retrieve user data from all users in spotify backend db.
// - RETURN: JSON Objects 
//
export async function getAllSpotifyUsersObj() {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Retrieve list of users from spotify
  console.log("getSpotifyData: Sending request to backend '/spotifyapi/getSpotifyUsersObj'")
  const spotifyUserData = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/spotifyapi/getSpotifyUsersObj`, {
    method: "GET",
    credentials: "include",
    cache: 'force-cache',
    next: { revalidate: 60 },
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

// 
// Submit a search query to the backend for spotify searching.
// - RETURN: JSON Objects 
//
export async function spotifySearch(type, query, limit, offset) {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Validate that user has connected spotify
  console.log("spotifySearch: Sending request to backend '/spotifyapi/spotifySearch'")
  const spotifySearchItemsResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/spotifyapi/spotifySearch/${type}/${query}/${limit}/${offset}`, {
    method: "GET",
    credentials: "include",
    cache: 'no-cache',
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    }
  });
  return await spotifySearchItemsResponse.json();
}

// 
// Check the backend to see if an album has already been submitted by a user
// - RETURN: Boolean
//
export async function checkIfAlbumAlreadyExists(album_spotify_id) {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Validate that user has connected spotify
  console.log("checkIfAlbumAlreadyExists: Sending request to backend '/spotifyapi/checkIfAlbumAlreadyExists'")
  const spotifyAlbumExistsResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/spotifyapi/checkIfAlbumAlreadyExists/${album_spotify_id}`, {
    method: "GET",
    credentials: "include",
    cache: 'no-cache',
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    }
  });
  const existsResponse = await spotifyAlbumExistsResponse.json()
  const exists = existsResponse['exists']
  return exists;
}

//
// Submit an album for adding to the Album of the day pool in the backend
// - RETURN: HttpResponse
//
export async function submitAlbumToBackend(albumObject) {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Validate that user has connected spotify
  console.log("submitAlbumToBackend: Sending request to backend '/spotifyapi/submitAlbum'")
  const submitAlbumResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/spotifyapi/submitAlbum`, {
    method: "POST",
    credentials: "include",
    cache: 'no-cache',
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    },
    body: JSON.stringify(albumObject)
  });
}

//
// Get album of the day data
// - RETURN: object containing album of the day data
//
export async function getAlbumOfTheDayData(date: string = '') {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Ternary optional date submission
  // Expected date format: yyyy-mm-dd
  const urlTail = ((date === "") ? '' : '/' + date)
  // Get album of the day
  console.log(`getAlbumOfTheDayData: Sending request to backend '/spotifyapi/getAlbumOfDay${urlTail}'`)
  const albumOfDayResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/spotifyapi/getAlbumOfDay${urlTail}`, {
    method: "GET",
    credentials: "include",
    next: { revalidate: 5 },
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    },
  });
  const albumOfDayInfo = await albumOfDayResponse.json()
  if("err_message" in albumOfDayInfo) {
    console.log("Error when retrieving album of the day!")
    return {}
  }
  // Get album Data
  console.log(`getAlbumOfTheDayData: Sending request to backend '/spotifyapi/getAlbum/${albumOfDayInfo['album_id']}'`)
  const albumDayResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/spotifyapi/getAlbum/${albumOfDayInfo['album_id']}`, {
    method: "GET",
    credentials: "include",
    cache: 'force-cache',
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    },
  });
  const albumData = await albumDayResponse.json()
  // Add Date for album of day
  albumData['AOD_date'] = albumOfDayInfo['date']
  return albumData;
}

//
// Get album rating
// - RETURN: object containing album of the day data
//
export async function getAlbumAvgRating(spotify_album_id, rounded = true) {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Tail to string for variants in API calls
  const urlTail = (rounded) ? "" : "/false"
  // Validate that user has connected spotify
  console.log(`getAlbumOfTheDayData: Sending request to backend '/spotifyapi/getAlbumAvgRating/${spotify_album_id}${urlTail}'`)
  const avgRatingResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/spotifyapi/getAlbumAvgRating/${spotify_album_id}${urlTail}`, {
    method: "GET",
    credentials: "include",
    cache: 'no-cache',
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    },
  });
  const albumAvgRatingData = await avgRatingResponse.json()
  return albumAvgRatingData['rating'];
}

//
// Get Reviews from Backend
// - RETURN: JSON Object of List of reviews
//
export async function getReviewsForAlbum(album_spotify_id) {
  // If no album ID provided, return empty list
  if(album_spotify_id == "") {
    return []
  }
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Validate that user has connected spotify
  console.log(`getReviewsForAlbum: Sending request to backend '/spotifyapi/getReviewsForAlbum/${album_spotify_id}'`)
  const reviewResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/spotifyapi/getReviewsForAlbum/${album_spotify_id}`, {
    method: "GET",
    credentials: "include",
    cache: 'no-cache',
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    },
  });
  const reviewListRes = await reviewResponse.json()
  return reviewListRes['review_list'];
}

//
// Get Review by User for specific Album from Backend
// - RETURN: HttpResponse
//
export async function getUserReviewForAlbum(album_spotify_id) {
  // If no album ID provided, return null
  if(album_spotify_id == "") {
    return null
  }
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Validate that user has connected spotify
  console.log(`getUserReviewForAlbum: Sending request to backend '/spotifyapi/getUserReviewForAlbum/${album_spotify_id}'`)
  const reviewResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/spotifyapi/getUserReviewForAlbum/${album_spotify_id}`, {
    method: "GET",
    credentials: "include",
    cache: 'no-cache',
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    },
  });
  const reviewRes = await reviewResponse.json()
  return reviewRes['review'];
}

//
// Submit a review to the backend
// - RETURN: HttpResponse
//
export async function submitReviewToBackend(reviewObject) {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Validate that user has connected spotify
  console.log("submitReviewToBackend: Sending request to backend '/spotifyapi/submitReview'")
  const submitReviewResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/spotifyapi/submitReview`, {
    method: "POST",
    credentials: "include",
    cache: 'no-cache',
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    },
    body: JSON.stringify(reviewObject)
  });
}

//
// Get Last X Album Submissions
// - RETURN: list in JSON
//
export async function getLastXSubmissions(count = 0) {
  // If no album ID provided, return empty list
  if(count == 0) {
    return []
  }
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Validate that user has connected spotify
  console.log(`getLastXSubmissions: Sending request to backend '/spotifyapi/getLastXAlbums/${count}'`)
  const subResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/spotifyapi/getLastXAlbums/${count}`, {
    method: "GET",
    credentials: "include",
    next: { revalidate: 5 },
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    },
  });
  const reviewListRes = await subResponse.json()
  return reviewListRes;
}

//
// Get Album Submission Stats
// - RETURN: list in JSON
//
export async function getAlbumsStats() {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Validate that user has connected spotify
  console.log(`getAlbumsStats: Sending request to backend '/spotifyapi/getAlbumsStats'`)
  const albumStatResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/spotifyapi/getAlbumsStats`, {
    method: "GET",
    credentials: "include",
    next: { revalidate: 5 },
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    },
  });
  const albumStatJson = await albumStatResponse.json()
  return albumStatJson;
}

//
// Get Lowest and Highest Album Stats
// - RETURN: Json Obejcts
//
export async function getLowestHighestAlbumStats() {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Validate that user has connected spotify
  console.log(`getLowestHighestAlbumStats: Sending request to backend '/spotifyapi/getLowestHighestAlbumStats'`)
  const albumLowHighStatResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/spotifyapi/getLowestHighestAlbumStats`, {
    method: "GET",
    credentials: "include",
    next: { revalidate: 60 },
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    },
  });
  const albumLowHighStatJson = await albumLowHighStatResponse.json()
  return albumLowHighStatJson;
}

//
// Get all Albums from Album Pool
// - RETURN: Json Obejcts
//
export async function getAllAlbums() {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Validate that user has connected spotify
  console.log(`getAllAlbums: Sending request to backend '/spotifyapi/getAllAlbums'`)
  const allAlbumsResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/spotifyapi/getAllAlbums`, {
    method: "GET",
    credentials: "include",
    next: { revalidate: 300 },
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    },
  });
  const allAlbumsJson = await allAlbumsResponse.json()
  return allAlbumsJson;
}

//
// Get all Albums from Album Pool HARD RELOAD (No cache)
// - RETURN: Json Obejcts
//
export async function getAllAlbumsNoCache() {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Validate that user has connected spotify
  console.log(`getAllAlbums: Sending request to backend '/spotifyapi/getAllAlbums'`)
  const allAlbumsResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/spotifyapi/getAllAlbums`, {
    method: "GET",
    credentials: "include",
    cache: 'no-cache',
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    },
  });
  const allAlbumsJson = await allAlbumsResponse.json()
  return allAlbumsJson;
}