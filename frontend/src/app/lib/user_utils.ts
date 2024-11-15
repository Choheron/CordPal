"use server"

import { cookies } from "next/headers";

// Below Code allows for serverside computing of cookie stuff!
const getCookie = async (name: string) => {
  return cookies().get(name)?.value ?? '';
}

//
// Retrieve a list of user IDs
// - RETURN: Json containing user data from DB
export async function getUserList() {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Reurn false if cookie is missing
  if(sessionCookie === "") {
    return false;
  }
  const userListResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/users/getUserList`, {
    method: "GET",
    credentials: "include",
    cache: 'no-cache',
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    }
  });
  const userListJSON = await userListResponse.json()
  return Object.values(userListJSON);
}

//
// Retrieve discord user Avatar URL
// Params:
// - Discord ID String (Conditional on if we are searching for a different user)
// RETURN: Json containing url
//
export async function getUserAvatarURL(discord_id = "") {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Reurn false if cookie is missing
  if(sessionCookie === "") {
    return false;
  }
  const avatarURLResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/users/getUserAvatarURL${(discord_id === "") ? '' : '/' + discord_id}`, {
    method: "GET",
    credentials: "include",
    cache: 'force-cache',
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    }
  });
  const avatarUrlJSON = await avatarURLResponse.json()
  return avatarUrlJSON['url'];
}

//
// Retrieve boolean on if a user is an admin
// Params:
// - Discord ID String (Conditional on if we are searching for a different user)
// RETURN: boolean
//
export async function isUserAdmin(discord_id = "") {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Reurn false if cookie is missing
  if(sessionCookie === "") {
    return false;
  }
  const isUserAdminResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/users/isUserAdmin${(discord_id === "") ? '' : '/' + discord_id}`, {
    method: "GET",
    credentials: "include",
    cache: 'force-cache',
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    }
  });
  const avatarUrlJSON = await isUserAdminResponse.json()
  return avatarUrlJSON['admin_status'];
}

//
// Retrieve user data using session info
// Params:
// - Discord ID String (Conditional on if we are searching for a different user)
// RETURN: Json containing user data from DB
//
export async function getUserData(discord_id = "") {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Reurn false if cookie is missing
  if(sessionCookie === "") {
    return false;
  }
  const userDataResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/users/getUserData${(discord_id === "") ? '' : '/' + discord_id}`, {
    method: "GET",
    credentials: "include",
    cache: 'force-cache',
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    }
  });
  return await userDataResponse.json();
}

//
// Update user info based on passed in json
// Params:
// - JSON containing the database keys and the new values
// RETURN: HTTP Status Code
//
export async function updateUserData(updatedJSON) {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Reurn false if cookie is missing
  if(sessionCookie === "") {
    return false;
  }
  const userDataResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/users/updateUserData`, {
    method: "POST",
    body: JSON.stringify(updatedJSON),
    credentials: "include",
    cache: 'no-cache',
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    }
  });
  return await userDataResponse.json();
}