"use server"

import { cookies } from "next/headers";

// Below Code allows for serverside computing of cookie stuff!
const getCookie = async (name: string) => {
  return cookies().get(name)?.value ?? '';
}

//
// Retrieve todo list for website from backend database
// - RETURN: Json containing the todo list items
//
export async function getAllTodoItems() {
  const sessionCookie = await getCookie('sessionid');
  // Query quotes endpoint for bot interaction
  const todoListResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/todo/getAllTodoItems`, {
    method: "GET",
    credentials: "include",
    cache: 'no-cache',
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    }
  });
  return JSON.parse(await todoListResponse.text());
}