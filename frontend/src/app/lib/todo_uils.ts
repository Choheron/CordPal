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

//
// Retrieve options for todo item creation
// RETURN: Json of options
//
export async function getTodoOptions() {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Reurn false if cookie is missing
  if(sessionCookie === "") {
    return false;
  }
  const todoOptionsResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/todo/getAllToDoChoices`, {
    method: "GET",
    credentials: "include",
    cache: 'force-cache',
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    }
  });
  const todoOptionsJson = await todoOptionsResponse.json();
  return todoOptionsJson;
}

//
// Create todo list item with required json data
//
export async function createToDoItem(todoData) {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Reurn false if cookie is missing
  if(sessionCookie === "") {
    return false;
  }
  const createTodoResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/todo/createTodo`, {
    method: "POST",
    credentials: "include",
    cache: 'force-cache',
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    },
    body: todoData,
  });
  return createTodoResponse.status
}