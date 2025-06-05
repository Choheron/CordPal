"use server"

import { revalidatePath, revalidateTag } from "next/cache";
import { padNumber } from "@/app/lib/utils"
import { cookies } from "next/headers";

// Below Code allows for serverside computing of cookie stuff!
const getCookie = async (name: string) => {
  return (await cookies()).get(name)?.value ?? '';
}

// 
// Determine if a user has Opted into AOtD.
// - RETURN: Boolen indicating aotd membership
//
export async function isAotdParticipant() {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Validate that user has opted into Aotd participation
  console.log("isAotdParticipant: Sending request to backend '/aotd/isAotdParticipant'")
  const aotdResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/aotd/isAotdParticipant`, {
    method: "GET",
    credentials: "include",
    cache: 'no-cache',
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    }
  });
  const isAotdConnected: boolean = (await aotdResponse.json())['connected'];
  return isAotdConnected;
}


// 
// Enroll a user in the AOtD
// - RETURN: Boolen representing successful
//
export async function enrollAotdUser() {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Validate that user has opted into Aotd participation
  console.log("isAotdParticipant: Sending request to backend '/aotd/enrollUser'")
  const aotdResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/aotd/enrollUser`, {
    method: "POST",
    credentials: "include",
    cache: 'no-cache',
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    }
  });
  const success: boolean = (await aotdResponse.json())['enrolled'];
  return success;
}


//
// Determine if a user is allowed to submit an album based off of criteria on the backend
// - RETURN: Object containing submission validity information
//
export async function checkIfUserCanSubmit() {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Determine if user can submit to backend
  console.log("checkIfUserCanSubmit: Sending request to backend '/aotd/checkIfUserCanSubmit'")
  const canSubmitResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/aotd/checkIfUserCanSubmit`, {
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
// Get a count of users who are participating in the AOtD
// - RETURN: Json containing user data from DB
export async function getAotdUserCount() {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Reurn false if cookie is missing
  if(sessionCookie === "") {
    return false;
  }
  console.log("getAotdUserCount: Sending request to backend '/aotd/getAotdUserCount'")
  const userListResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/aotd/getAotdUserCount`, {
    method: "GET",
    credentials: "include",
    cache: 'force-cache',
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    }
  });
  const userListJSON = await userListResponse.json()
  return userListJSON['count'];
}


// 
// Submit a search query to musicbrainz.
// - RETURN: JSON Objects 
//
export async function musicBrainzAlbumSearch(albumTitle, artist = null) {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Build query params
  const params = `?query=release:"${albumTitle}"${(artist) ? ` AND artist:"${artist}"` : ""}&limit=15&fmt=json`
  // Send search query to musicbrainz to search for album
  console.log(`musicBrainzAlbumSearch: Sending request to musicbrainz for an album search: https://musicbrainz.org/ws/2/release/${params}`)
  const albumSearchItemsResponse = await fetch(`https://musicbrainz.org/ws/2/release/${params}`, {
    method: "GET",
    credentials: "include",
    cache: 'no-cache',
    headers: {
      Cookie: `sessionid=${sessionCookie};`,
      "User-Agent": "CordPal/0.0.1 (www.cordpal.app)"
    }
  });
  const response = await albumSearchItemsResponse.json();
  return response;
}


//
// Submit an album for adding to the Album of the day pool in the backend
// - RETURN: HttpResponse
//
export async function submitAlbumToBackend(albumObject) {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Submit an album to the backend
  console.log("submitAlbumToBackend: Sending request to backend '/aotd/submitAlbum'")
  const submitAlbumResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/aotd/submitAlbum`, {
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
// Retrieve user data from backend relating to AOtD.
// - RETURN: JSON Objects 
//
export async function getAotdData() {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Retrieve user aotd data
  console.log("getAotdData: Sending request to backend '/aotd/getAotdData'")
  const aotdResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/aotd/getAotdData`, {
    method: "GET",
    credentials: "include",
    cache: 'force-cache',
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    }
  });
  return await aotdResponse.json();
}


// 
// Retrieve user data from all users in aotd backend db.
// - RETURN: JSON Objects 
//
export async function getAllAotdUsersObj() {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Retrieve list of users from backend
  console.log("getAllAotdUsersObj: Sending request to backend '/aotd/getAllAotdUsersObj'")
  const aotdResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/aotd/getAllAotdUsersObj`, {
    method: "GET",
    credentials: "include",
    next: { revalidate: 60 },
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    }
  });
  return await aotdResponse.json();
}


// 
// Retrieve user data from all users in aotd backend db.
// - RETURN: JSON Objects 
//
export async function getAllAotdUsersList() {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Retrieve list of users that are members of AOTD from backend
  console.log("getAlllAotdUsersList: Sending request to backend '/aotd/getAotdUsersList'")
  const aotdUserData = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/aotd/getAotdUsersList`, {
    method: "GET",
    credentials: "include",
    next: { revalidate: 60 },
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    }
  });
  return (await aotdUserData.json())['users'];
}


// 
// Check the backend to see if an album has already been submitted by a user
// - RETURN: Boolean
//
export async function checkIfAlbumAlreadyExists(release_group_id) {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Check if a user has already submitted this album
  console.log("checkIfAlbumAlreadyExists: Sending request to backend '/aotd/checkIfAlbumAlreadyExists'")
  const aotdAlbumExistsResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/aotd/checkIfAlbumAlreadyExists/${release_group_id}`, {
    method: "GET",
    credentials: "include",
    cache: 'no-cache',
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    }
  });
  const existsResponse = await aotdAlbumExistsResponse.json()
  return existsResponse;
}


//
// Delete an album from the backend pool
// - RETURN: HttpResponse
//
export async function deleteAlbumFromBackend(mbid, reason = null) {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Make request to delete album
  console.log("deleteAlbumFromBackend: Sending request to backend '/aotd/deleteAlbum'")
  const deleteAlbumResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/aotd/deleteAlbum`, {
    method: "POST",
    credentials: "include",
    cache: 'no-cache',
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    },
    body: JSON.stringify({"album_id": mbid, "reason": reason})
  });
  const status = deleteAlbumResponse.status
  // Revalidate requests to ensure no data is lost
  revalidateTag('album_submissions')
  revalidateTag(`album_${mbid}`)
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
  console.log(`getAlbumOfTheDayData: Sending request to backend '/aotd/getAlbumOfDay${urlTail}'`)
  const albumOfDayResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/aotd/getAlbumOfDay${urlTail}`, {
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
export async function getAlbumAvgRating(mbid, rounded = true, date = null) {
  // If mbid is null, return 0
  if(mbid == null) {
    return 0.0
  }
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Tail to string for variants in API calls
  const urlTail = ((rounded) ? "/" : "/false") + ((date != null) ? `/${date}` : "")
  // Query from backend
  console.log(`getAlbumAvgRating: Sending request to backend '/aotd/getAlbumAvgRating/${mbid}${urlTail}'`)
  const avgRatingResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/aotd/getAlbumAvgRating/${mbid}${urlTail}`, {
    method: "GET",
    credentials: "include",
    cache: 'force-cache',
    next: { tags: [`album_review_${mbid}`] },
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
export async function getReviewsForAlbum(mbid, date = null) {
  // If no album ID provided, return empty list
  if(mbid == "") {
    return []
  }
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Url Tail Definition
  const urlTail = `/${mbid}${((date != null) ? `/${date}` : "")}`
  // Get all user reviews for an album
  console.log(`getReviewsForAlbum: Sending request to backend '/aotd/getReviewsForAlbum${urlTail}'`)
  const reviewResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/aotd/getReviewsForAlbum${urlTail}`, {
    method: "GET",
    credentials: "include",
    cache: 'force-cache',
    next: { tags: [`album_review_${mbid}`] },
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
  console.log(`getDayTimelineData: Sending request to backend '/aotd/getDayTimelineData/${date}'`)
  const dayTimelineResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/aotd/getDayTimelineData/${date}`, {
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
export async function getUserReviewForAlbum(mbid, date = null) {
  // If no album ID provided, return null
  if(mbid == "") {
    return null
  }
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Url Tail Definition
  const urlTail = `/${mbid}${((date != null) ? `/${date}` : "")}`
  // Get user's review for an album
  console.log(`getUserReviewForAlbum: Sending request to backend '/aotd/getUserReviewForAlbum${urlTail}'`)
  const reviewResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/aotd/getUserReviewForAlbum${urlTail}`, {
    method: "GET",
    credentials: "include",
    cache: 'force-cache',
    next: { tags: [`album_review_${mbid}`] },
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    },
  });
  const reviewRes = await reviewResponse.json()
  const backendReview = reviewRes['review']
  // Check if a user cookie exists for aotd_review that is the same as the passed in id
  const hasCookieReview = (await cookies()).has(`aotd_review_${mbid}`)
  if(hasCookieReview) {
    const cookieReview = JSON.parse(await getCookie(`aotd_review_${mbid}`));
    // Parse date from backend review, see if timestamp is newer on cookie
    if(backendReview != null) {
      const backendDate = Date.parse(backendReview['last_updated'])
      const cookieDate = Date.parse(cookieReview['last_updated'])
      if(backendDate < cookieDate) {
        return backendDate
      }
    }
    return {...cookieReview, "cookie": true, "backendExist": (backendReview != null)}
  }
  return backendReview;
}


//
// Set Review cookie, so as to be able to save reviews in progress
// - RETURN: HttpResponse
//
export async function setReviewCookie(reviewText, reviewScore, mbid, first_listen) {
  // If no album ID provided, return null
  if(mbid == "") {
    return null
  }
  // Get cookies
  const cookieStore = await cookies()
  // Create review object
  const reviewCookieObj = {
    album_id: mbid,
    score: reviewScore,
    comment: reviewText,
    first_listen: first_listen,
    last_updated: new Date().toISOString()
  }
  // Overwrite or set the review in the cookie
  console.log(`setReviewCookie: Setting user review cookie!`)
  cookieStore.set(`aotd_review_${mbid}`, JSON.stringify(reviewCookieObj), { secure: true, maxAge: 86400 })
  return true;
}


//
// Submit a review to the backend
// - RETURN: HttpResponse
//
export async function submitReviewToBackend(reviewObject) {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Submit user's review to the backend
  console.log("submitReviewToBackend: Sending request to backend '/aotd/submitReview'")
  const submitReviewResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/aotd/submitReview`, {
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
  // Query Backend for Recent Submissions
  console.log(`getLastXSubmissions: Sending request to backend '/aotd/getLastXAlbums/${count}'`)
  const subResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/aotd/getLastXAlbums/${count}`, {
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
  // Query Backend for Album Stats
  console.log(`getAlbumsStats: Sending request to backend '/aotd/getAlbumsStats'`)
  const albumStatResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/aotd/getAlbumsStats`, {
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
  // Query Backend for lowest and highest album stats
  console.log(`getLowestHighestAlbumStats: Sending request to backend '/aotd/getLowestHighestAlbumStats'`)
  const albumLowHighStatResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/aotd/getLowestHighestAlbumStats`, {
    method: "GET",
    credentials: "include",
    cache: 'force-cache',
    next: { tags: ['AOTD'] },
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
  
  console.log(`getAllAlbums: Sending request to backend '/aotd/getAllAlbums'`)
  const allAlbumsResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/aotd/getAllAlbums`, {
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
export async function getAlbum(mbid: string) {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  
  const allAlbumsResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/aotd/getAlbum/${mbid}`, {
    method: "GET",
    credentials: "include",
    cache: 'force-cache',
    next: { tags: [`album_${mbid}`] },
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    },
  });
  console.log(`getAlbum: Attempted request to backend '/aotd/getAlbum/${mbid}'`)
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
  
  console.log(`getAllAlbums: Sending request to backend '/aotd/getAllAlbums'`)
  const allAlbumsResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/aotd/getAllAlbums`, {
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
  
  console.log(`getLowestHighestAlbumStats: Sending request to backend '/aotd/getAllUserReviewStats'`)
  const userReviewStatResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/aotd/getAllUserReviewStats`, {
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
  
  console.log(`getUserReviewStats: Sending request to backend '/aotd/getUserReviewStats${urlTail}'`)
  const userReviewStatResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/aotd/getUserReviewStats${urlTail}`, {
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
  
  console.log(`getAllUserReviews: Sending request to backend '/aotd/getAllUserReviews${urlTail}'`)
  const allUserReviewsResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/aotd/getAllUserReviews${urlTail}`, {
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
export async function getSimilarReviewsForRatings(user_discord_id: string) {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  
  console.log(`getSimilarReviewsForRatings: Sending request to backend '/aotd/getSimilarReviewsForRatings'`)
  const similarlyRatedResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/aotd/getSimilarReviewsForRatings`, {
    method: "GET",
    credentials: "include",
    cache: 'force-cache',
    next: { tags: [`review_submissions_${user_discord_id}`] },
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
export async function getAotdDates(mbid) {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  
  console.log(`getAotdDates: Sending request to backend '/aotd/getAotdDates/${mbid}'`)
  const aotdDatesResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/aotd/getAotdDates/${mbid}`, {
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
  
  console.log(`getChanceOfAotdSelect: Sending request to backend '/aotd/getChanceOfAotdSelect${urlTail}'`)
  const aotdChanceResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/aotd/getChanceOfAotdSelect${urlTail}`, {
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
  
  console.log(`getAOtDByMonth: Sending request to backend '/aotd/getAOtDByMonth/${year}/${month}'`)
  const aotdMonthResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/aotd/getAOtDByMonth/${year}/${month}`, {
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
  
  console.log(`getSubmissionsByMonth: Sending request to backend '/aotd/getSubmissionsByMonth/${year}/${month}'`)
  const submissionsMonthResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/aotd/getSubmissionsByMonth/${year}/${month}`, {
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
  
  console.log(`getReviewStatsByMonth: Sending request to backend '/aotd/getReviewStatsByMonth/${year}/${month}'`)
  const reviewMonthResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/aotd/getReviewStatsByMonth/${year}/${month}`, {
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
  console.log(`getOutages: Sending request to backend '/aotd/getUserOutages${urlTail}'`)
  const getOutagesResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/aotd/getUserOutages${urlTail}`, {
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
  console.log(`createOutage: Sending request to backend '/aotd/createOutage'`)
  const createOutageResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/aotd/createOutage`, {
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
  console.log(`addReviewReaction: Sending request to backend '/aotd/submitReviewReaction'`)
  const reviewReactResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/aotd/submitReviewReaction`, {
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
    revalidateTag(`review_${reactObj['id']}`)
    revalidateTag(`album_review_${reactObj['mbid']}`) // Revalidate review tag for the specific album
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
  console.log(`deleteReviewReaction: Sending request to backend '/aotd/deleteReviewReaction'`)
  const reviewReactDeleteResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/aotd/deleteReviewReaction`, {
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
    revalidateTag(`review_${reactObj['id']}`)
    revalidateTag(`album_review_${reactObj['mbid']}`) // Revalidate review tag for the specific album
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
  console.log(`getReviewByID: Sending request to backend '/aotd/getReviewByID/${review_id}`)
  const getReviewResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/aotd/getReviewByID/${review_id}`, {
    method: "GET",
    credentials: "include",
    next: { tags: [`review_${review_id}`] },
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
  console.log(`getReviewHistoricalByID: Sending request to backend '/aotd/getReviewHistoricalByID/${review_id}`)
  const getReviewHistoricalResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/aotd/getReviewHistoricalByID/${review_id}`, {
    method: "GET",
    credentials: "include",
    next: { tags: [`review_${review_id}`] },
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    },
  });
  const getReviewHistoricalJson = await getReviewHistoricalResponse.json()
  return getReviewHistoricalJson;
}


//
// Get the standard deviation for the reviews for an album on a given date
//
export async function getAlbumSTD(mbid, date = "") {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Determine URL tail
  const urlTail = `/${mbid}${((date != null) ? `/${date}` : "")}`
  // Make backend request
  console.log(`getAlbumSTD: Sending request to backend '/aotd/getAlbumSTD${urlTail}`)
  const getAlbumSTDResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/aotd/getAlbumSTD${urlTail}`, {
    method: "GET",
    credentials: "include",
    next: { tags: [`album_review_${mbid}`] },
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    },
  });
  const getAlbumSTDResponseJson = await getAlbumSTDResponse.json()
  return getAlbumSTDResponseJson['standard_deviation'];
}