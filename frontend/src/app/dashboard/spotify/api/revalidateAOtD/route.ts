import { revalidateTag } from "next/cache"
 
export async function POST() {
  // Revalidate AOtD tag
  revalidateTag('AOtD')
  // Revalidate Reviews tag
  revalidateTag('reviews')
  // Revalidate Submissions Tag
  revalidateTag('album_submissions')
  // Return success code
  return new Response('Success!', {
    status: 200,
  })
}