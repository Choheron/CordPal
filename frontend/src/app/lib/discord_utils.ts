"use server"

import { cookies } from "next/headers";

// Below Code allows for serverside computing of cookie stuff!
const getCookie = async (name: string) => {
  return cookies().get(name)?.value ?? '';
}

// 
// Determine if a user is a member of the required server, and return boolean.
// - RETURN: Boolen indicating member status
//
export async function isMember() {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Validate that user is member of server
  console.log("isMember: Sending request to backend '/discordapi/validateMember'")
  const memberResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/discordapi/validateMember`, {
    method: "GET",
    credentials: "include",
    cache: 'force-cache',
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    }
  });
  const isMemberOfServer: boolean = (await memberResponse.json())['member'];
  return isMemberOfServer;
}

//
// Verify session cookie is in storage, to skip login page
// - RETURN: Boolean indication login/auth status
//
export async function verifyAuth() {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Reurn false if cookie is missing
  if(sessionCookie === "") {
    return false;
  }
  // Validate that user is previously authorized and has valid discord token
  console.log("verifyAuth: Sending request to backend '/discordapi/checkToken'")
  const prevAuthResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/discordapi/checkToken`, {
    method: "GET",
    credentials: "include",
    cache: 'no-cache',
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    }
  });
  const isAuthorized: boolean = (await prevAuthResponse.json())['valid'];
  return isAuthorized;
}

//
// Retrieve discord user data using session info
// - RETURN: Json containing discord basic user data
//
export async function getDiscordUserData() {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Reurn false if cookie is missing
  if(sessionCookie === "") {
    return false;
  }
  const userDataResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/discordapi/userData`, {
    method: "GET",
    credentials: "include",
    cache: 'force-cache',
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    }
  });
  return await userDataResponse.json();
}