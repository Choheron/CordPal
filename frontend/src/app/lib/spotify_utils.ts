"use server"

import { revalidatePath, revalidateTag } from "next/cache";
import { padNumber } from "@/app/lib/utils"
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
// Determine if a user is allowed to submit an album based off of criteria on the backend
// - RETURN: Object containing submission validity information
//
export async function checkIfUserCanSubmit() {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Validate that user has connected spotify
  console.log("checkIfUserCanSubmit: Sending request to backend '/spotifyapi/checkIfUserCanSubmit'")
  const canSubmitResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/spotifyapi/checkIfUserCanSubmit`, {
    method: "GET",
    credentials: "include",
    cache: 'no-cache',
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    }
  });
  const canSubmitData = await canSubmitResponse.json();
  return canSubmitData;
}

//
// Get a count of users who have connected spotify
// - RETURN: Json containing user data from DB
export async function getSpotifyUserCount() {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Reurn false if cookie is missing
  if(sessionCookie === "") {
    return false;
  }
  console.log("getSpotifyUserCount: Sending request to backend '/spotifyapi/getSpotifyUserCount'")
  const userListResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/spotifyapi/getSpotifyUserCount`, {
    method: "GET",
    credentials: "include",
    cache: 'no-cache',
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    }
  });
  const userListJSON = await userListResponse.json()
  return userListJSON['count'];
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
  console.log("getAllSpotifyUsersObj: Sending request to backend '/spotifyapi/getSpotifyUsersObj'")
  const spotifyUserData = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/spotifyapi/getSpotifyUsersObj`, {
    method: "GET",
    credentials: "include",
    next: { revalidate: 60 },
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
export async function getAllSpotifyUsersList() {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Retrieve list of users from spotify
  console.log("getAllSpotifyUsersList: Sending request to backend '/spotifyapi/getSpotifyUsersList'")
  const spotifyUserData = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/spotifyapi/getSpotifyUsersList`, {
    method: "GET",
    credentials: "include",
    next: { revalidate: 60 },
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    }
  });
  return (await spotifyUserData.json())['users'];
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
  return existsResponse;
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
  // Revalidate requests to see recent submissions
  revalidateTag('album_submissions')
  // Return Status
  return submitAlbumResponse.status
}


//
// Delete an album from the backend pool
// - RETURN: HttpResponse
//
export async function deleteAlbumFromBackend(album_spotify_id, reason = null) {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Make request to delete album
  console.log("deleteAlbumFromBackend: Sending request to backend '/spotifyapi/deleteAlbum'")
  const deleteAlbumResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/spotifyapi/deleteAlbum`, {
    method: "POST",
    credentials: "include",
    cache: 'no-cache',
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    },
    body: JSON.stringify({"album_id": album_spotify_id, "reason": reason})
  });
  const status = deleteAlbumResponse.status
  // Revalidate requests to ensure no data is lost
  revalidateTag('album_submissions')
  revalidateTag(`album_${album_spotify_id}`)
  return status
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
    cache: 'force-cache',
    next: { tags: ['AOtD'] },
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    },
  });
  const albumOfDayInfo = await albumOfDayResponse.json()
  if("err_message" in albumOfDayInfo) {
    console.log("Error when retrieving album of the day!")
    return {"error_message": "No album found", "album_id": null}
  }
  const albumData = await albumOfDayInfo['album_data']
  // Add Date for album of day
  albumData['AOD_date'] = albumOfDayInfo['date']
  return albumData;
}

//
// Get album rating
// - RETURN: object containing album of the day data
//
export async function getAlbumAvgRating(spotify_album_id, rounded = true, date = null) {
  // If spotify id is null, return 0
  if(spotify_album_id == null) {
    return 0.0
  }
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Tail to string for variants in API calls
  const urlTail = ((rounded) ? "" : "/false") + ((date != null) ? `/${date}` : "")
  // Validate that user has connected spotify
  console.log(`getAlbumOfTheDayData: Sending request to backend '/spotifyapi/getAlbumAvgRating/${spotify_album_id}${urlTail}'`)
  const avgRatingResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/spotifyapi/getAlbumAvgRating/${spotify_album_id}${urlTail}`, {
    method: "GET",
    credentials: "include",
    cache: 'force-cache',
    next: { tags: ['review_submissions'] },
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    },
  });
  const albumAvgRatingData = await avgRatingResponse.json()
  return (albumAvgRatingData['rating'] != null) ? (albumAvgRatingData['rating']) : (0.0);
}

//
// Get Reviews from Backend
// - RETURN: JSON Object of List of reviews
//
export async function getReviewsForAlbum(album_spotify_id, date = null) {
  // If no album ID provided, return empty list
  if(album_spotify_id == "") {
    return []
  }
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Url Tail Definition
  const urlTail = `/${album_spotify_id}${((date != null) ? `/${date}` : "")}`
  // Get all user reviews for an album
  console.log(`getReviewsForAlbum: Sending request to backend '/spotifyapi/getReviewsForAlbum${urlTail}'`)
  const reviewResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/spotifyapi/getReviewsForAlbum${urlTail}`, {
    method: "GET",
    credentials: "include",
    cache: 'force-cache',
    next: { tags: ['review_submissions', `album-reviews-${album_spotify_id}`] },
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    },
  });
  const reviewListRes = await reviewResponse.json()
  return reviewListRes['review_list'];
}


//
// Get Reviews from Backend
// - RETURN: JSON Object of List of reviews
//
export async function getDayTimelineData(date: string = "") {
  // If no album ID provided, return empty list
  if(date == "") {
    return []
  }
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Get all user reviews for an album
  console.log(`getDayTimelineData: Sending request to backend '/spotifyapi/getDayTimelineData/${date}'`)
  const dayTimelineResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/spotifyapi/getDayTimelineData/${date}`, {
    method: "GET",
    credentials: "include",
    cache: 'force-cache',
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    },
  });
  const reviewListRes = await dayTimelineResponse.json()
  return reviewListRes['timeline'];
}


//
// Get Review by User for specific Album from Backend
// - RETURN: HttpResponse
//
export async function getUserReviewForAlbum(album_spotify_id, date = null) {
  // If no album ID provided, return null
  if(album_spotify_id == "") {
    return null
  }
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Url Tail Definition
  const urlTail = `/${album_spotify_id}${((date != null) ? `/${date}` : "")}`
  // Get user's review for an album
  console.log(`getUserReviewForAlbum: Sending request to backend '/spotifyapi/getUserReviewForAlbum${urlTail}'`)
  const reviewResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/spotifyapi/getUserReviewForAlbum${urlTail}`, {
    method: "GET",
    credentials: "include",
    cache: 'force-cache',
    next: { tags: [`album_review_${album_spotify_id}`] },
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
  // Submit user's review to the backend
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
  // Revalidate review related calls
  revalidateTag('review_submissions')
  revalidateTag(`review_submissions_${reviewObject['userId']}`)
  revalidateTag(`album_review_${reviewObject['album_id']}`)
  // Revalidate AOTD calls for calendar views
  const now = new Date()
  revalidateTag(`calendar-${now.getFullYear()}-${padNumber(now.getMonth() + 1)}`)
  // Return callback code
  return submitReviewResponse.status
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
    cache: 'force-cache',
    next: { tags: ['album_submissions'] },
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
    cache: 'force-cache',
    next: { tags: ['album_submissions', 'review_submissions'] },
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
    cache: 'force-cache',
    next: { tags: ['review_submissions'] },
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
    cache: 'force-cache',
    next: { tags: ['album_submissions', 'ATOD'] },
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    },
  });
  const allAlbumsJson = await allAlbumsResponse.json()
  return allAlbumsJson;
}

//
// Get an Album and its data
// - RETURN: Json Obejcts
//
export async function getAlbum(album_spotify_id: string) {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Validate that user has connected spotify
  const allAlbumsResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/spotifyapi/getAlbum/${album_spotify_id}`, {
    method: "GET",
    credentials: "include",
    cache: 'force-cache',
    next: { tags: [`album_${album_spotify_id}`] },
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    },
  });
  console.log(`getAlbum: Attempted request to backend '/spotifyapi/getAlbum/${album_spotify_id}' -> Data Generated: ${allAlbumsResponse.headers.get('X-Generated-At')}`)
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

//
// Get Users Review Statistics
// - RETURN: Json Obejct
//
export async function getAllUserReviewStats() {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Validate that user has connected spotify
  console.log(`getLowestHighestAlbumStats: Sending request to backend '/spotifyapi/getAllUserReviewStats'`)
  const userReviewStatResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/spotifyapi/getAllUserReviewStats`, {
    method: "GET",
    credentials: "include",
    cache: 'force-cache',
    next: { tags: ['review_submissions'] },
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    },
  });
  const userReviewStatJson = await userReviewStatResponse.json()
  return userReviewStatJson;
}


//
// Get a single Users Review Statistics
// - RETURN: Json Obejct
//
export async function getUserReviewStats(userId: string = "") {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Determine url tail
  const urlTail = `${(userId == "") ? "" : `/${userId}`}`
  // Validate that user has connected spotify
  console.log(`getUserReviewStats: Sending request to backend '/spotifyapi/getUserReviewStats${urlTail}'`)
  const userReviewStatResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/spotifyapi/getUserReviewStats${urlTail}`, {
    method: "GET",
    credentials: "include",
    cache: 'force-cache',
    next: { tags: [`review_submissions_${userId}`] },
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    },
  });
  const userReviewStatJson = await userReviewStatResponse.json()
  return userReviewStatJson;
}


//
// Get all reviews left by a user
// - RETURN: Json object
//
export async function getAllUserReviews(userId: string = "") {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Determine url tail
  const urlTail = `${(userId == "") ? "" : `/${userId}`}`
  // Validate that user has connected spotify
  console.log(`getAllUserReviews: Sending request to backend '/spotifyapi/getAllUserReviews${urlTail}'`)
  const allUserReviewsResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/spotifyapi/getAllUserReviews${urlTail}`, {
    method: "GET",
    credentials: "include",
    cache: 'force-cache',
    next: { tags: [`review_submissions_${userId}`] },
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    },
  });
  const allUserReviewsJson = await allUserReviewsResponse.json()
  return allUserReviewsJson;
}


//
// Tenor Integration to get GIF Data from Tenor based on passed in URL or Gif ID
// Params:
//   - tenor_url: String - Full tenor url
//   - tenor_gif_id: String - Tenor gif ID
//
export async function getTenorGifData(tenor_url: string = "", tenor_gif_id: string = "") {
  // Validate what has been passed in
  let gif_id: any = "";
  if(tenor_url != "") {
    gif_id = tenor_url.split("-").at(-1)
  } else if(tenor_gif_id != "") {
    gif_id = tenor_gif_id
  } else {
    throw new Error("A gif ID or URL must be provided...");
  }
  // Build backend URL
  const callUrl = `${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/tenor/getGifUrl/${gif_id}`
  // Make call to backend
  console.log(`getTenorGifData: Sending request to backend '${callUrl}'`)
  const tenorGifResponse = await fetch(callUrl, {
    method: "GET",
    next: { revalidate: 86400 }
  });
  const retJson = await tenorGifResponse.json();
  // Return URL
  return retJson['url']
}

//
// Get user's similarly rated albums for the review slider tooltip
//
export async function getSimilarReviewsForRatings() {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Validate that user has connected spotify
  console.log(`getSimilarReviewsForRatings: Sending request to backend '/spotifyapi/getSimilarReviewsForRatings'`)
  const similarlyRatedResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/spotifyapi/getSimilarReviewsForRatings`, {
    method: "GET",
    credentials: "include",
    cache: 'force-cache',
    next: { tags: ['review_submissions'] },
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    },
  });
  const similarlyRatedJSON = await similarlyRatedResponse.json()
  return similarlyRatedJSON;
}

//
// Get aotd dates for a passed in albumid
//
export async function getAotdDates(album_spotify_id) {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Validate that user has connected spotify
  console.log(`getAotdDates: Sending request to backend '/spotifyapi/getAotdDates/${album_spotify_id}'`)
  const aotdDatesResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/spotifyapi/getAotdDates/${album_spotify_id}`, {
    method: "GET",
    credentials: "include",
    cache: 'force-cache',
    next: { tags: ['AOtD'] },
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    },
  });
  const aotdDatesJson = await aotdDatesResponse.json()
  return aotdDatesJson['aotd_dates'];
}


//
// Get the percentage chance of a user's album submission being picked for AOtD
//
export async function getChanceOfAotdSelect(user_discord_id: string = "") {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Determine URL tail
  const urlTail = (user_discord_id != "") ? `/${user_discord_id}` : ""
  // Validate that user has connected spotify
  console.log(`getChanceOfAotdSelect: Sending request to backend '/spotifyapi/getChanceOfAotdSelect${urlTail}'`)
  const aotdChanceResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/spotifyapi/getChanceOfAotdSelect${urlTail}`, {
    method: "GET",
    credentials: "include",
    cache: 'force-cache',
    next: { tags: ['AOtD', 'review_submissions', 'album_submissions', `calendar-outages`] },
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    },
  });
  const aotdChanceJson = await aotdChanceResponse.json()
  return aotdChanceJson['percentage'];
}


//
// Get all AOtD Objects for a certian month
//
export async function getAOtDByMonth(year: string = "", month: string = "") {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Validate that user has connected spotify
  console.log(`getAOtDByMonth: Sending request to backend '/spotifyapi/getAOtDByMonth/${year}/${month}'`)
  const aotdMonthResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/spotifyapi/getAOtDByMonth/${year}/${month}`, {
    method: "GET",
    credentials: "include",
    cache: 'force-cache',
    next: { tags: [`calendar-${year}-${month}`] },
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    },
  });
  const aotdMonthJson = await aotdMonthResponse.json()
  return aotdMonthJson;
}


//
// Get submission stats for a certian month
//
export async function getSubmissionsByMonth(year: string = "", month: string = "") {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Validate that user has connected spotify
  console.log(`getSubmissionsByMonth: Sending request to backend '/spotifyapi/getSubmissionsByMonth/${year}/${month}'`)
  const submissionsMonthResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/spotifyapi/getSubmissionsByMonth/${year}/${month}`, {
    method: "GET",
    credentials: "include",
    cache: 'force-cache',
    next: { tags: [`calendar-${year}-${month}`] },
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    },
  });
  const submissionsMonthJson = await submissionsMonthResponse.json()
  return submissionsMonthJson;
}


//
// Get review stats for a certian month
//
export async function getReviewStatsByMonth(year: string = "", month: string = "") {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Validate that user has connected spotify
  console.log(`getReviewStatsByMonth: Sending request to backend '/spotifyapi/getReviewStatsByMonth/${year}/${month}'`)
  const reviewMonthResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/spotifyapi/getReviewStatsByMonth/${year}/${month}`, {
    method: "GET",
    credentials: "include",
    cache: 'force-cache',
    next: { tags: [`calendar-${year}-${month}`] },
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    },
  });
  const reviewMonthJson = await reviewMonthResponse.json()
  return reviewMonthJson;
}


//
// Get outage dates for a user
//
export async function getUserOutages(user_discord_id = null) {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Determine URL tail
  const urlTail = (user_discord_id) ? `/${user_discord_id}` : ""
  // Make backend request
  console.log(`getOutages: Sending request to backend '/spotifyapi/getUserOutages${urlTail}'`)
  const getOutagesResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/spotifyapi/getUserOutages${urlTail}`, {
    method: "GET",
    credentials: "include",
    cache: 'force-cache',
    next: { tags: [`calendar-outages`] },
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    },
  });
  const getOutagesJson = await getOutagesResponse.json()
  return getOutagesJson['outages'];
}


//
// Submit a new outage to the backend for the user
//
export async function createOutage(outageObj: object) {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Make backend request
  console.log(`createOutage: Sending request to backend '/spotifyapi/createOutage'`)
  const createOutageResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/spotifyapi/createOutage`, {
    method: "POST",
    credentials: "include",
    cache: 'no-cache',
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    },
    body: JSON.stringify(outageObj)
  });
  // Revalidate outage tag
  revalidateTag("calendar-outages")
  const createOutageMessage = await createOutageResponse.text()
  const createOutageStatus = await createOutageResponse.status
  return {"status": createOutageStatus, "message": createOutageMessage};
}


//
// Submit a reaction for a review to the backend
//
export async function addReviewReaction(reactObj) {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Make backend request
  console.log(`addReviewReaction: Sending request to backend '/spotifyapi/submitReviewReaction'`)
  const reviewReactResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/spotifyapi/submitReviewReaction`, {
    method: "POST",
    credentials: "include",
    cache: 'no-cache',
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    },
    body: JSON.stringify(reactObj)
  });
  const reviewReactStatus = reviewReactResponse.status
  // If status was a success, revalidate review tag 
  if(reviewReactStatus == 200) {
    revalidateTag(`review-${reactObj['id']}`)
    revalidateTag(`album-reviews-${reactObj['album_spotify_id']}`) // Revalidate review tag for the specific album
  }
  // Return Status
  return reviewReactStatus;
}


//
// Submit a reaction for a review to the backend
//
export async function deleteReviewReaction(reactObj) {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Make backend request
  console.log(`deleteReviewReaction: Sending request to backend '/spotifyapi/deleteReviewReaction'`)
  const reviewReactDeleteResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/spotifyapi/deleteReviewReaction`, {
    method: "POST",
    credentials: "include",
    cache: 'no-cache',
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    },
    body: JSON.stringify(reactObj)
  });
  const reviewReactDeleteStatus = reviewReactDeleteResponse.status
  // If status was a success, revalidate review tag 
  if(reviewReactDeleteStatus == 200) {
    revalidateTag(`review-${reactObj['id']}`)
    revalidateTag(`album-reviews-${reactObj['album_spotify_id']}`) // Revalidate review tag for the specific album
  }
  // Return Status
  return reviewReactDeleteStatus;
}


//
// Get a review by its backend PK id
//
export async function getReviewByID(review_id) {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Make backend request
  console.log(`getReviewByID: Sending request to backend '/spotifyapi/getReviewByID/${review_id}`)
  const getReviewResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/spotifyapi/getReviewByID/${review_id}`, {
    method: "GET",
    credentials: "include",
    next: { tags: [`review-${review_id}`] },
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    },
  });
  const getReviewJson = await getReviewResponse.json()
  return getReviewJson;
}


//
// Get a review and its historical edits by its backend PK id
//
export async function getReviewHistoricalByID(review_id) {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Make backend request
  console.log(`getReviewHistoricalByID: Sending request to backend '/spotifyapi/getReviewHistoricalByID/${review_id}`)
  const getReviewHistoricalResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/spotifyapi/getReviewHistoricalByID/${review_id}`, {
    method: "GET",
    credentials: "include",
    next: { tags: [`review-${review_id}`] },
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    },
  });
  const getReviewHistoricalJson = await getReviewHistoricalResponse.json()
  return getReviewHistoricalJson;
}