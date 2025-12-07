"use server"

import { revalidateTag, updateTag } from "next/cache";
import { cookies } from "next/headers";

// Below Code allows for serverside computing of cookie stuff!
const getCookie = async (name: string) => {
  return (await cookies()).get(name)?.value ?? '';
}

//
// Retrieve all images currently stored on the backend
//
export async function getAllPhotoshops() {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Reurn false if cookie is missing
  if(sessionCookie === "") {
    return false;
  }
  const photosResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/photos/getAllImages`, {
    method: "GET",
    credentials: "include",
    cache: 'force-cache',
    next: { tags: ['all_photoshops'] },
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    }
  });
  let response = JSON.parse(await photosResponse.text());
  return response['ids']
}

//
// Retrieve photoshops with filters applied
//
export async function getPhotoshops(uploader, artist, tagged) {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Reurn false if cookie is missing
  if(sessionCookie === "") {
    return false;
  }
  // Build out request body
  const req_body = {
    "tagged": `${tagged}`,
    "uploader": `${uploader}`,
    "artist": `${artist}`
  }
  const photosResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/photos/getImageIds/`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(req_body),
    cache: 'force-cache',
    next: { tags: ['all_photoshops'] },
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    },
  });
  let response = JSON.parse(await photosResponse.text());
  return response['imageIds']
}

//
// Request image data from the backend
//
export async function getImageData(image_id) {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Reurn false if cookie is missing
  if(sessionCookie === "") {
    return false;
  }
  console.log("Attempting to get image data for image: " + image_id)
  const photosDataResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/photos/getImageInfo/${image_id}`, {
    method: "GET",
    credentials: "include",
    cache: 'force-cache',
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    }
  });
  let response: Object = await photosDataResponse.json();
  return response
}

//
// Post image to backend using formdata
//
export async function uploadImageToBackend(formData) {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Reurn false if cookie is missing
  if(sessionCookie === "") {
    return false;
  }
  const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/photos/uploadImage/`, {
    method: "POST",
    credentials: "include",
    cache: 'no-cache',
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    },
    body: formData,
  });
  // Revalidate photoshops tag
  updateTag('all_photoshops')
  return {
    status: uploadResponse.status,
    crid: uploadResponse.headers.get("X-CRID")
  }
}


//
// Get list of all uploader Discord IDs
//
export async function getAllUploaders() {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Reurn false if cookie is missing
  if(sessionCookie === "") {
    return false;
  }
  const requestURL = `${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/photos/getAllUploaders/`
  console.log(`getAllUploaders: Sending request to backend '/photos/getAllUploaders/'`)
  const uploaderListResponse = await fetch(requestURL, {
    method: "GET",
    credentials: "include",
    cache: 'force-cache',
    next: { tags: ['all_photoshops'] },
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    },
  });
  // Parse uploader list
  const idList = (await uploaderListResponse.json())['uploaders'];
  // Return uploader list
  return idList;
}


//
// Get list of all artist Discord IDs
//
export async function getAllArtists() {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Reurn false if cookie is missing
  if(sessionCookie === "") {
    return false;
  }
  const requestURL = `${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/photos/getAllArtists/`
  console.log(`getAllArtists: Sending request to backend '/photos/getAllArtists/'`)
  const artistListResponse = await fetch(requestURL, {
    method: "GET",
    credentials: "include",
    cache: 'force-cache',
    next: { tags: ['all_photoshops'] },
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    },
  });
  // Parse artist list
  const idList = (await artistListResponse.json())['artists'];
  // Return artist list
  return idList;
}