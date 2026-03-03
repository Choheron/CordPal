import { getUserData } from "@/app/lib/user_utils";
import { getTenorGifData } from "@/app/lib/aotd_utils";

// Do required replacements to review text on the serverside offloaded from review text. Returns the updated review text amd parsed track comments in object
export async function doReviewEmbedReplacements(reviewObj) {
  const review = reviewObj;
  var reviewMessage = review['comment'];
  const reviewVersion = review['version']
  const advanced = review['advanced']
  const trackData = (advanced) ? review['trackData'] : null

  // Do replacements of embeds in a function
  async function doEmbedReplacements(embedText: any) {
    let temp = embedText
    // Regex for youtube video embedding
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:\?[\w=&%-]*)?(?:&t=(\d+h)?(\d+m)?(\d+s)?)?/g;
    // Regex for tenor gif embedding
    const tenorRegex = /(?:https?:\/\/)?(?:www\.)?tenor\.com\/view\/[a-zA-Z0-9_'-]+-(\d+)/g;
    // Parse Review Text
    if(reviewVersion == 1) {
      // Do youtube link replacements [ONLY IF THIS IS A VERSION 1 REVIEW]
      temp = temp.replace(youtubeRegex, (match, videoId, hours, minutes, seconds) => {
        // Convert timestamp to seconds
        const h = hours ? parseInt(hours) * 3600 : 0;
        const m = minutes ? parseInt(minutes) * 60 : 0;
        const s = seconds ? parseInt(seconds) : 0;
        const startTime = h + m + s;

        const startParam = startTime > 0 ? `?start=${startTime}` : '';
        return `<iframe width="300" height="168.75" src="https://www.youtube.com/embed/${videoId}${startParam}" frameborder="0" allowfullscreen></iframe>`;
      })
    }
    // Do Tenor Link Replacements
    // Extract all Tenor GIF IDs
    const tenorMatches = [...temp.matchAll(tenorRegex)];
    if (tenorMatches.length > 0) {
      // Fetch all Tenor GIF URLs asynchronously
      const gifPromises = tenorMatches.map(async ([match, gifId]) => {
        const gifUrl = await getTenorGifData(gifId);
        return { match, gifUrl };
      });

      const gifResults = await Promise.all(gifPromises);

      // Replace Tenor URLs with their corresponding <img> tags
      gifResults.forEach(({ match, gifUrl }) => {
        temp = temp.replace(match, `<img src="https://placehold.co/400x200?text=GIF+NO+LONGER+AVAILABLE+ON+TENOR+CONTACT+CORDPAL+SUPPORT"/>`);
      });
    }
    return temp
  }

  // Replace overall review message embeds
  reviewMessage = await doEmbedReplacements(reviewMessage)
  const parsedTrackComments = advanced ? await Promise.all(
      Object.values(trackData).sort((a: any, b: any) => a.number - b.number).map(async (songObj: any) => {
        const parsedComment = await doEmbedReplacements(songObj['cordpal_comment']);
        return { ...songObj, parsedComment };
      })
    ) : [];
  // Final Return
  return {
    message: reviewMessage,
    parsedComments: parsedTrackComments
  }
}