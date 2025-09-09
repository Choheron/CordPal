"use server"

import { cookies } from "next/headers";

// Below Code allows for serverside computing of cookie stuff!
const getCookie = async (name: string) => {
  return (await cookies()).get(name)?.value ?? '';
}

//
// Retrieve bot quotes for all users in the server
// - RETURN: Json containing the backend quote data for all users
//
export async function getAllBotQuotes() {
  const sessionCookie = await getCookie('sessionid');
  // Query quotes endpoint for bot interaction
  const quoteListResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/quotes/getAllQuotesLegacy`, {
    method: "GET",
    credentials: "include",
    cache: 'no-cache',
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    }
  });
  let json = JSON.parse(await quoteListResponse.text());
  delete json["meta"]
  return json
}
  