import { revalidateTag } from "next/cache"
import { padNumber } from "@/app/lib/utils"
 
export async function POST() {
  const now = new Date();
  const tags = [
    'AOTD',
    'reviews',
    'album_submissions',
    `calendar-${now.getFullYear()}-${padNumber(now.getMonth() + 1)}`
  ]
  // Revalite tags
  tags.forEach((tag, index) => {
    console.log(`revalidateAOtD - Revalidating Tag: ${tag}`)
    revalidateTag(tag)
  })
  // Return success code
  return new Response('Success!', {
    status: 200,
  })
}