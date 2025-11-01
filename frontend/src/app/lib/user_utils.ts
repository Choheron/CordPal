"use server"

import { revalidateTag } from "next/cache";
import { cookies } from "next/headers";

// Below Code allows for serverside computing of cookie stuff!
const getCookie = async (name: string) => {
  return (await cookies()).get(name)?.value ?? '';
}


//
// Get a count of users in the system
// - RETURN: Json containing user data from DB
export async function getUserCount() {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Reurn false if cookie is missing
  if(sessionCookie === "") {
    return false;
  }
  const userListResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/users/getUserCount`, {
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
    next: { revalidate: 120 },
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    }
  });
  const userListJSON = await userListResponse.json()
  return Object.values(userListJSON['users']);
}


//
// Retrieve an object containing all users online statuses
// - RETURN: Json containing user online statuses
export async function getAllOnlineData() {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Reurn false if cookie is missing
  if(sessionCookie === "") {
    return false;
  }
  const userOnlineResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/users/getAllOnlineData`, {
    method: "GET",
    credentials: "include",
    cache: 'no-cache',
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    }
  });
  const userOnlineJson = await userOnlineResponse.json()
  return userOnlineJson;
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
// Retrieve boolean on if a user is an admin
// Params:
// - Discord ID String (Conditional on if we are searching for a different user)
// RETURN: boolean
//
export async function isUserAlbumUploader(album_mbid: string, discord_id: string = "") {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Reurn false if cookie is missing
  if(sessionCookie === "") {
    return false;
  }
  const isUserUploaderResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/aotd/isUserAlbumUploader/${album_mbid}${(discord_id === "") ? '' : '/' + discord_id}`, {
    method: "GET",
    credentials: "include",
    cache: 'force-cache',
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    }
  });
  const isUserUploaderJson = await isUserUploaderResponse.json()
  return isUserUploaderJson['uploader'];
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
    next: { tags: ['user-data'] },
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
  // Revalidate User Data
  revalidateTag('user-data')
  // Return json
  return await userDataResponse.json();
}


//
// Update user info based on passed in json
// Params:
// - JSON containing the database keys and the new values
// RETURN: Boolean for if a user is online or not
//
export async function isUserOnline(discord_id) {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Reurn false if cookie is missing
  if(sessionCookie === "") {
    return false;
  }
  const userOnlineResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/users/isOnline/${discord_id}`, {
    method: "GET",
    credentials: "include",
    cache: 'no-cache',
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    }
  });
  // Get online status JSON
  const userOnlineJson = await userOnlineResponse.json();
  // Return json
  return userOnlineJson
}


//
// Get a list of users grouped by timezone
//
export async function getUsersByTimezone() {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Reurn false if cookie is missing
  if(sessionCookie === "") {
    return false;
  }
  const usersByTimezoneResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/users/getUsersByTimezone`, {
    method: "GET",
    credentials: "include",
    cache: 'force-cache',
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    }
  });
  // Get online status JSON
  const usersByTimezoneJson = await usersByTimezoneResponse.json();
  // Return json
  return usersByTimezoneJson['users']
}


//
// Make POST request to backend to implement heartbeat online status
//
export async function heartbeat(timezoneStr: string = "") {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Reurn false if cookie is missing
  if(sessionCookie === "") {
    return false;
  }
  const heartbeatResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/users/heartbeat`, {
    method: "POST",
    credentials: "include",
    cache: 'no-cache',
    headers: {
      Cookie: `sessionid=${sessionCookie};`,
      'X-Heartbeat': 'true'
    },
    body: JSON.stringify({"heartbeat": {'timezone': timezoneStr}})
  });
  const heartbeatStatus = await heartbeatResponse.status;
  const heartbeatMessage = await heartbeatResponse.text();
  return {"status": heartbeatStatus, "body": heartbeatMessage}
}


//
// Check backend to see if a user field is unique
//
export async function isUserFieldUnique(field: string, value: string) {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Reurn false if cookie is missing
  if(sessionCookie === "") {
    return false;
  }
  const unqiueResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/users/isFieldUnique`, {
    method: "POST",
    credentials: "include",
    cache: 'no-cache',
    body: JSON.stringify(
      {
        "field": field,
        "value": value,
      }
    )
  });
  const uniqueStatus = await unqiueResponse.status;
  const uniqueJSON = await unqiueResponse.json();
  return {"status": uniqueStatus, "json": uniqueJSON}
}


//
// Get all possible login methods for user
//
export async function getUserLoginMethods(discord_id = "") {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Reurn false if cookie is missing
  if(sessionCookie === "") {
    return false;
  }
  const userDataResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/users/getLoginMethods${(discord_id === "") ? '' : '/' + discord_id}`, {
    method: "GET",
    credentials: "include",
    cache: 'force-cache',
    next: { tags: ['user-data'] },
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    }
  });
  return (await userDataResponse.json())['methods'];
}


//
// Get all password requirements 
//
export async function getPasswordValidators() {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Reurn false if cookie is missing
  if(sessionCookie === "") {
    return false;
  }
  const passvalidatorsResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/users/getPasswordValidators`, {
    method: "GET",
    credentials: "include",
    cache: 'force-cache',
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    }
  });
  return (await passvalidatorsResponse.json())['validators'];
}


//
// Send request to backend to set user password 
//
export async function updateUserPassword(updateBody) {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Reurn false if cookie is missing
  if(sessionCookie === "") {
    return false;
  }
  const updateUserPasswordResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/users/updateUserPassword`, {
    method: "POST",
    credentials: "include",
    cache: 'no-cache',
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    },
    body: JSON.stringify(updateBody)
  });
  const status = updateUserPasswordResponse.status
  const data = await updateUserPasswordResponse.json()
  // Revalidate user data
  revalidateTag('user-data')
  // Return
  return ({"code": status, "data": data})
}


//
// Retrieve last 10 user actions from backend
//
export async function getRecentUserActions() {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Reurn false if cookie is missing
  if(sessionCookie === "") {
    return false;
  }
  const userActionsResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/users/getRecentUserActions`, {
    method: "GET",
    credentials: "include",
    cache: 'force-cache',
    next: { tags: ['user-data'] },
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    }
  });
  return await userActionsResponse.json();
}