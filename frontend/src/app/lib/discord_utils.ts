"use server"

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const getCookie = async (name: string) => {
  return (await cookies()).get(name)?.value ?? '';
}

//
// Determine if a user is a member of the required server, and return boolean.
// - RETURN: Boolean indicating member status
//
export async function isMember() {
  const sessionCookie = await getCookie('sessionid');
  console.log("isMember: Sending request to backend '/discordapi/validateMember'")
  const memberResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/discordapi/validateMember`, {
    method: "GET",
    credentials: "include",
    cache: 'no-store',
    headers: {
      Cookie: `sessionid=${sessionCookie};`,
      'X-Member-Check': `true`
    }
  });
  if(memberResponse.status == 302) {
    redirect("/")
  }
  const responseObj = await memberResponse.json()
  const isMemberOfServer: boolean = responseObj['member'] && responseObj['role'];
  return isMemberOfServer;
}

//
// Verify session cookie is in storage, to skip login page
// - RETURN: true if valid, or { valid: false, reason: string } if not
//
export async function verifyAuth(): Promise<true | { valid: false | true; reason?: string }> {
  const sessionCookie = await getCookie('sessionid');
  if(sessionCookie === "") {
    return { valid: false, reason: 'NO_SESSION' };
  }
  console.log("verifyAuth: Sending request to backend '/discordapi/checkToken'")
  const prevAuthResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/discordapi/checkToken`, {
    method: "GET",
    credentials: "include",
    cache: 'no-store',
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    }
  });
  const responseJson = await prevAuthResponse.json();
  if(responseJson['valid']) {
    return { valid: true, reason: 'NA' };
  }
  return { valid: false, reason: responseJson['reason'] };
}

//
// Retrieve discord user data using session info
// - RETURN: Json containing discord basic user data
//
export async function getDiscordUserData() {
  const sessionCookie = await getCookie('sessionid');
  if(sessionCookie === "") {
    return false;
  }
  const userDataResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/discordapi/userData`, {
    method: "GET",
    credentials: "include",
    cache: 'no-store',
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    }
  });
  if(userDataResponse.status == 302) {
    redirect("/")
  }
  return await userDataResponse.json();
}
