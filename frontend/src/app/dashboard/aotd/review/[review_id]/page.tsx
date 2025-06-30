"use server"

import { getAlbum, getReviewHistoricalByID, getTenorGifData } from "@/app/lib/aotd_utils"
import { getUserData } from "@/app/lib/user_utils"
import { convertToLocalTZString, generateDateFromUTCString, padNumber, ratingToTailwindBgColor } from "@/app/lib/utils"
import { Conditional } from "@/app/ui/dashboard/conditional"
import PageTitle from "@/app/ui/dashboard/page_title"
import ReviewHistoryAccordion from "@/app/ui/dashboard/aotd/review_history_accordion"
import ReviewEmojiMartClientWrapper from "@/app/ui/dashboard/aotd/reviewsWrappers/client_review_reacton_emoji_wrapper.tsx"
import ClientTimestamp from "@/app/ui/general/client_timestamp"
import StarRating from "@/app/ui/general/star_rating"
import UserCard from "@/app/ui/general/userUiItems/user_card"
import { Divider } from "@heroui/react"

// Page to display historial data for an specific date
export default async function Page({
  params,
}: {
  params: Promise<{ review_id: string }>
}) {
  const review_id = (await params).review_id
  // Get review from backend
  const review_data = await getReviewHistoricalByID(review_id)
  // Get album data from backend
  const album_data = await getAlbum(review_data['album_id'])
  // Get user data
  const user_data = await getUserData()
  // Generate date object of review date
  const reviewDateObj = generateDateFromUTCString(review_data['review_date'])
  // Parse some data from review object
  const reviewDate = convertToLocalTZString(reviewDateObj, false)

  // Determine return url based on if the review is for today's AOtD or not (EXTREMELY UGLY, I HAVE GOT TO FIGURE OUT THIS DATE STUFF)
  const timezoneDate = new Date(Date.parse(new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' }).split(",")[0])).toISOString().split('T')[0].replaceAll("-", "/")
  const reviewDateSplit = review_data['review_date'].split(",")[0].split("/")
  const reviewDateFormatted = `${reviewDateSplit[2]}/${padNumber(reviewDateSplit[0])}/${padNumber(reviewDateSplit[1])}`
  const isReviewToday = (timezoneDate == reviewDateFormatted)
  // Determine if today is the current review date
  const returnUrl = (isReviewToday) ? `/dashboard/aotd` : `/dashboard/aotd/calendar/${reviewDateObj.getFullYear()}/${padNumber(reviewDateObj.getMonth() + 1)}/${padNumber(reviewDateObj.getDate())}`

  const performReplacements = async(reviewText) => {
    // Parse review text to display embeds 
    // Regex for youtube video embedding
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:\?[\w=&%-]*)?(?:&t=(\d+h)?(\d+m)?(\d+s)?)?/g;
    // Regex for tenor gif embedding
    const tenorRegex = /(?:https?:\/\/)?(?:www\.)?tenor\.com\/view\/[a-zA-Z0-9_-]+-(\d+)/g;
    // Placeholder text
    let temp: any = reviewText
    // Parse Review Text
    if(review_data['version'] == 1) {
      // Do youtube link replacements [ONLY IF THIS IS A VERSION 1 REVIEW]
      temp =  review_data['comment'].replace(youtubeRegex, (match, videoId, hours, minutes, seconds) => {
        // Convert timestamp to seconds
        const h = hours ? parseInt(hours) * 3600 : 0;
        const m = minutes ? parseInt(minutes) * 60 : 0;
        const s = seconds ? parseInt(seconds) : 0;
        const startTime = h + m + s;

        const startParam = startTime > 0 ? `?start=${startTime}` : '';
        return `<iframe width="600" height="337.5" class="mx-auto" src="https://www.youtube.com/embed/${videoId}${startParam}" frameborder="0" allowfullscreen></iframe>`;
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
        temp = temp.replace(match, `<img src="${gifUrl}" frameborder="0" width="300" height="auto" class="max-w-300 h-full mx-auto" />`);
      });
    }
    // Return final message text
    return temp
  }

  return (
    <div className="flex flex-col w-full items-center p-3 pb-36 pt-10 overflow-x-hidden">
      <PageTitle text={`${review_data['user_nickname']}'s ${reviewDate} Review`} />
      <div className="w-full md:w-3/4 2xl:w-1/2 font-extralight">
        {/* Show Album Cover Data */}
        <div
          className="flex flex-col sm:float-left w-56 pr-6"
        >
          <a
            className="group hover:underline"
            href={returnUrl}
          >
            <img
              src={album_data['album_img_src']}
              alt={`Album Cover for ${album_data['title']}`}
              className="w-56 h-auto mb-1 rounded-2xl shadow-md"
            />
            <p className="text-ellipsis line-clamp-1 text-lg">
              <b>{album_data['title']}</b>
            </p>
            <p className="text-sm italic -mt-1">
              {album_data['artist']['name']}
            </p>
            <Conditional showWhen={album_data['release_date'] != "Unknown"}>
              <div className="text-xs lg:text-sm lg:-mt-1 group-hover:underline">
                <ClientTimestamp 
                  className="" 
                  timestamp={album_data['release_date']} 
                  full={false} 
                  maintainUTC={true}
                  datePrecision={album_data['release_date_precision']}
                />
              </div>
            </Conditional>
          </a>
        </div>
        {/* Display User Data */}
        <div className="flex flex-col mb-3">
          <div className="group">
            <UserCard 
              userDiscordID={review_data['user_id']} 
              customDescription={
                <p className="text-gray-400/80 group-hover:underline">View User Profile</p>
              }
              isProfileLink
            />
          </div>
          <div className="flex h-fit">
            <StarRating
              rating={review_data['score']}
              textSize="text-normal sm:text-xl md:text-2xl lg:text-3xl my-auto"
            />
            <p className={`ml-2 px-2 h-fit my-auto rounded-xl text-black ${ratingToTailwindBgColor(review_data['score'])}`}>
              <b>{review_data['score'].toFixed(2)}</b>
            </p>
          </div>
          {/* Display Review Tags */}
          <div className="flex gap-2 justify-start">
            <Conditional showWhen={review_data['first_listen'] == true}>
              <p className="bg-green-700/90 rounded-xl px-2 py-1 border border-green-500 text-black font-bold italic text-xs">
                First Time Listen
              </p>
            </Conditional>
            <Conditional showWhen={review_data['advanced']}>
              <p className="bg-red-700/90 rounded-xl px-2 py-1 border border-red-500 text-black font-bold italic text-xs">
                Advanced Review
              </p>
            </Conditional>
          </div>
          <Divider className="mt-1 w-full" />
        </div>
        {/* Display Review Content */}
        <Conditional showWhen={review_data['advanced']}>
          <p className="mt-[6px] text-lg mr-auto ml-0">Overall Review:</p>
        </Conditional>
        <div 
          className="w-full prose prose-invert prose-sm !max-w-none mb-2 font-normal"
          dangerouslySetInnerHTML={{__html: await performReplacements(review_data['comment'])}}
        />
        {/* If advanced review, display song breakdown */}
        <Conditional showWhen={review_data['advanced']}>
          <p className="mt-[6px] text-lg mr-auto ml-0">Track by Track:</p>
          {
            Object.values(review_data['trackData']).sort((a: any, b: any) => a['number'] - b['number']).map(async(songObj: any) => (
              <div 
                key={songObj['number']}
                className="text-left w-full"
              >
                <div className="flex flex-col md:flex-row gap-2">
                  <p className="text-base ml-2">{songObj['number']}. <b>{songObj['title']}</b></p>
                  <StarRating
                    rating={songObj['cordpal_rating']}
                    className="text-yellow-400 my-auto"
                    textSize="text-2xl"
                  />
                </div>
                <Conditional showWhen={(songObj['cordpal_comment'] != "No Comment Provided...") && (songObj['cordpal_comment'] != "<p></p>")}>
                  <div 
                    className="prose prose-invert prose-sm mx-2 p-1 pb-5" 
                    dangerouslySetInnerHTML={{__html: await performReplacements(songObj['cordpal_comment'])}}
                  />
                </Conditional>
              </div>
            ))
          }
        </Conditional>
        <div className="flex flex-col text-gray-500">
          <div className="text-right text-sm font-extralight">
            <ClientTimestamp timestamp={review_data['last_updated']} full={true} />
          </div>
          <Conditional showWhen={review_data['historical'].length != 0}>
            <div className="flex w-full gap-1 text-right text-xs italic">
              <p className="ml-auto">Updated {review_data['historical'].length - 1} times since </p>
              <ClientTimestamp timestamp={review_data['last_updated']} full={true} />
            </div>
          </Conditional>
        </div>
      </div>
      {/* Emoji Reactions Display */}
      <div className="relative w-full md:w-3/4 2xl:w-1/2 font-extralight">
        <ReviewEmojiMartClientWrapper 
          userData={user_data}
          reviewId={review_data['id']}
          reactionsList={review_data['reactions']}
          emojiButtonOverride="absolute -bottom-11 -left-1"
        />
      </div>

      <Conditional showWhen={review_data['historical'].length > 1}>
        {/* Display warning for dates error in review history */}
        <Conditional showWhen={reviewDateObj < new Date("April 6, 2025")} >
          <div className="w-full md:w-3/4 2xl:w-1/2 font-extralight mx-auto px-2 py-2 my-2 text-small text-center italic border border-neutral-800 rounded-2xl bg-zinc-800/30 mt-11 -mb-11">
            <p>
              <span className="text-yellow-600"><b>WARNING:</b></span> Review history/edit data recorded before the date of April 6th, 2025 will have inconsistencies and issues due to bugs on the backend.
              This is a result of the database not properly storing updates when new versions of reviews are created. Most common issues: Score updates not showing, text updates not showing, timestamps 
              being wrong, etc.
            </p>
          </div>
        </Conditional>
        <div className="relative w-full md:w-3/4 2xl:w-1/2 font-extralight">
          <ReviewHistoryAccordion
            review={review_data}
            reviewHistoryList={review_data['historical']}
          />
        </div>
      </Conditional>
    </div>    
  )
}