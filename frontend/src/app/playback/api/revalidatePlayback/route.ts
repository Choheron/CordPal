import { revalidateTag } from "next/cache"
 
export async function POST() {
  const now = new Date();
  const tags = [
    'playbackAvailable',
    `playback_${now.getFullYear()}`
  ]
  // Revalite tags
  tags.forEach((tag, index) => {
    console.log(`revalidatePlayback - Revalidating Tag: ${tag}`)
    revalidateTag(tag, { expire: 0 })
  })
  // Return success code
  return new Response('Success!', {
    status: 200,
  })
}