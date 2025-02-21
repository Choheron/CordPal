import { revalidateTag } from "next/cache"
import { padNumber } from "@/app/lib/utils"
 
export async function POST() {
  // Revalidate AOtD tag
  revalidateTag('AOtD')
  // Revalidate Reviews tag
  revalidateTag('reviews')
  // Revalidate Submissions Tag
  revalidateTag('album_submissions')
  // Revalidate tag for calendars
  const now = new Date();
  revalidateTag(`calendar-${now.getFullYear()}-${padNumber(now.getMonth() + 1)}`)
  // Return success code
  return new Response('Success!', {
    status: 200,
  })
}