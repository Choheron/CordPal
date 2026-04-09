"use server"

import { revalidateTag } from "next/cache";
import { cookies } from "next/headers";

// Below Code allows for serverside computing of cookie stuff!
const getCookie = async (name: string) => {
  return (await cookies()).get(name)?.value ?? '';
}


//
// Retrieve all active custom emojis in emoji-mart compatible format.
// Used by the emoji picker to dynamically populate the Custom category.
// - RETURN: Array of emoji objects { id, emoji_id, name, keywords, skins }
//
export async function getCustomEmojiList() {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Return false if cookie is missing
  if(sessionCookie === "") {
    return false;
  }
  console.log("getCustomEmojiList: Sending request to backend '/emojis/list/'")
  const emojiResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/emojis/list/`, {
    method: "GET",
    credentials: "include",
    cache: 'force-cache',
    next: { tags: ['custom_emoji_list'] },
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    }
  });
  const response = await emojiResponse.json();
  return response['emojis'];
}


//
// Upload a new custom emoji to the backend.
// Accepts multipart FormData with fields: name, display_name, keywords, attached_image, filename, filetype.
// - RETURN: Object containing status code and CRID for error tracking
//
export async function uploadEmoji(formData: FormData) {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Return false if cookie is missing
  if(sessionCookie === "") {
    return false;
  }
  console.log("uploadEmoji: Sending request to backend '/emojis/upload/'")
  const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/emojis/upload/`, {
    method: "POST",
    credentials: "include",
    cache: 'no-cache',
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    },
    body: formData,
  });
  // Revalidate emoji list cache so the new emoji appears in the picker immediately
  revalidateTag('custom_emoji_list', "max");
  return {
    status: uploadResponse.status,
    crid: uploadResponse.headers.get("X-CRID"),
    data: await uploadResponse.json()
  }
}


//
// Record a single use of a custom emoji.
// Called fire-and-forget from the emoji picker whenever a custom emoji is selected.
// Errors are silently swallowed — use count tracking is best-effort, not critical.
//
export async function recordEmojiUse(emojiId: number) {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Return silently if cookie is missing — this is fire-and-forget
  if(sessionCookie === "") {
    return;
  }
  console.log(`recordEmojiUse: Recording use for emoji_id=${emojiId}`)
  try {
    await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/emojis/recordUse/${emojiId}/`, {
      method: "POST",
      credentials: "include",
      cache: 'no-cache',
      headers: {
        Cookie: `sessionid=${sessionCookie};`
      }
    });
  } catch {
    // Silently swallow — use count tracking should never surface errors to the user
  }
}


//
// Retrieve all custom emojis with full admin metadata.
// Includes inactive emojis and raw submitted_at regardless of the hide flag.
// Admin only — backend will return 403 for non-staff callers.
// - RETURN: Array of emoji objects with full admin fields
//
export async function getAdminEmojiList() {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Return false if cookie is missing
  if(sessionCookie === "") {
    return false;
  }
  console.log("getAdminEmojiList: Sending request to backend '/emojis/adminList/'")
  const emojiResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/emojis/adminList/`, {
    method: "GET",
    credentials: "include",
    cache: 'no-cache',
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    }
  });
  const response = await emojiResponse.json();
  return response['emojis'];
}


//
// Admin action. Permanently delete a custom emoji by emoji_id.
// Removes both the DB record and the file from disk. Invalidates the emoji list cache.
// - RETURN: Object containing status code and CRID for error tracking
//
export async function deleteEmoji(emojiId: number, reason?: string) {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Return false if cookie is missing
  if(sessionCookie === "") {
    return false;
  }
  console.log(`deleteEmoji: Sending request to backend '/emojis/delete/${emojiId}/'`)
  const deleteResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/emojis/delete/${emojiId}/`, {
    method: "POST",
    credentials: "include",
    cache: 'no-cache',
    headers: {
      Cookie: `sessionid=${sessionCookie};`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ reason: reason ?? null })
  });
  // Revalidate emoji list cache so the deleted emoji is removed from the picker immediately
  revalidateTag('custom_emoji_list', "max");
  return {
    status: deleteResponse.status,
    crid: deleteResponse.headers.get("X-CRID")
  }
}


//
// Admin action. Toggle is_active and/or hide_submitted_at on an existing emoji.
// Only these two fields are patchable — names cannot be changed post-creation as
// they are referenced by existing reactions and review content.
// Invalidates the emoji list cache.
// - RETURN: Object containing status code, CRID, and updated emoji data
//
export async function updateEmojiMeta(emojiId: number, patch: { is_active?: boolean; hide_submitted_at?: boolean }) {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Return false if cookie is missing
  if(sessionCookie === "") {
    return false;
  }
  console.log(`updateEmojiMeta: Sending request to backend '/emojis/updateMeta/${emojiId}/'`)
  const updateResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/emojis/updateMeta/${emojiId}/`, {
    method: "POST",
    credentials: "include",
    cache: 'no-cache',
    headers: {
      Cookie: `sessionid=${sessionCookie};`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(patch)
  });
  // Revalidate emoji list cache so visibility changes take effect in the picker immediately
  revalidateTag('custom_emoji_list', "max");
  return {
    status: updateResponse.status,
    crid: updateResponse.headers.get("X-CRID"),
    data: await updateResponse.json()
  }
}
