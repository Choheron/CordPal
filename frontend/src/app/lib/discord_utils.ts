"use server"

import { cookies } from "next/headers";

// 
// Determine if a user is a member of the required server, and return boolean.
//
export async function isMember() {
  // Below Code allows for serverside computing of cookie stuff!
  const getCookie = async (name: string) => {
    return cookies().get(name)?.value ?? '';
  }
  const sessionCookie = await getCookie('sessionid');
  // Validate that user is member of server
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

