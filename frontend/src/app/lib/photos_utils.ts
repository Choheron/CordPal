"use server"

import { cookies } from "next/headers";

// Below Code allows for serverside computing of cookie stuff!
const getCookie = async (name: string) => {
  return cookies().get(name)?.value ?? '';
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
    cache: 'no-cache',
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    }
  });
  let response = JSON.parse(await photosResponse.text());
  return response['ids']
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
    cache: 'no-cache',
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
  return uploadResponse.status;
}