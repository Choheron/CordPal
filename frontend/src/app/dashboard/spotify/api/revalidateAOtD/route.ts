import { revalidateTag } from "next/cache"
 
export async function POST() {
  // Revalidate AOtD tag
  revalidateTag('AOtD')
  // Revalidate Reviews tag
  revalidateTag('reviews')
  // Return success code
  return new Response('Success!', {
    status: 200,
  })
}