"use server"

import { cookies } from "next/headers";

// Below Code allows for serverside computing of cookie stuff!
const getCookie = async (name: string) => {
  return cookies().get(name)?.value ?? '';
}

//
// Retrieve user data using session info
// - RETURN: Json containing user data from DB
//
export async function getUserData() {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Reurn false if cookie is missing
  if(sessionCookie === "") {
    return false;
  }
  const userDataResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/users/getUserData`, {
    method: "GET",
    credentials: "include",
    cache: 'no-cache',
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