"use server"

import { cookies } from "next/headers";

// Below Code allows for serverside computing of cookie stuff!
const getCookie = async (name: string) => {
  return (await cookies()).get(name)?.value ?? '';
}

// Result of a review image upload, as seen by the editor.
//  - status: HTTP status from the backend (200 on success; 400/401/403 for client-side rejections; 500 otherwise)
//  - crid:   CordPal request id from the X-CRID header, surfaced in failure toasts so users can report it
//  - url:    first-party path to put in the <img src> (e.g. /dashboard/aotd/api/review-image/<hex>); only on success
//  - error:  client-safe message from the backend's {'error': ...} body; only on failure
export type UploadResponse = {
  status: number
  crid: string | null
  url?: string
  error?: string
}

//
// Post image to backend using formdata
//
export async function uploadReviewImage(formData: FormData): Promise<UploadResponse> {
  // Check for sessionid in cookies
  const sessionCookie = await getCookie('sessionid');
  // Reurn false if cookie is missing
  if(sessionCookie === "") {
    return { status: 401, crid: null, error: 'Not authenticated' };
  }
  // Parse filename from formData
  const filename = (formData.get('attached_image') as File)?.name
  // Make post request to backend
  console.log(`uploadReviewImage: Sending ReviewImage '${filename}' to backend '/aotd/uploadReviewImage'`)
  const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/aotd/uploadReviewImage`, {
    method: "POST",
    credentials: "include",
    cache: 'no-cache',
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    },
    body: formData,
  });
  const body = await uploadResponse.json().catch(() => ({}))
  const crid = uploadResponse.headers.get("X-CRID");
  if(uploadResponse.status !== 200) {
    console.error(`uploadReviewImage: Upload of '${filename}' failed with status ${uploadResponse.status} (CRID: ${crid})`)
  } else {
    console.log(`uploadReviewImage: Upload of '${filename}' succeeded (CRID: ${crid})`)
  }
  return { status: uploadResponse.status, crid: uploadResponse.headers.get('X-CRID'), url: body.image?.url, error: body.error }
}