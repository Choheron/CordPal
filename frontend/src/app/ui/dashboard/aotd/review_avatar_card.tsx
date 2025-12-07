"use server"

import {Popover, PopoverTrigger, PopoverContent} from "@heroui/popover";
import { Link } from "@heroui/link";
import { ScrollShadow } from "@heroui/scroll-shadow";

import StarRating from "../../general/star_rating";
import UserCard from "../../general/userUiItems/user_card";

import { getTenorGifData } from "@/app/lib/aotd_utils";
import ClientTimestamp from "../../general/client_timestamp";
import { Conditional } from "../conditional";
import ReviewEmojiMartClientWrapper from "./reviewsWrappers/client_review_reacton_emoji_wrapper.tsx";
import { getUserData } from "@/app/lib/user_utils";
import { ratingToTailwindBgColor, songRatingToString } from "@/app/lib/utils";

// GUI Display for a single review as a popover/avatar combo
// Expected Props:
//  - review_obj: Object - Review Data Object
//  - index: Number - Index in list
export default async function ReviewAvatarCard(props) {
  const review = props.review_obj;
  var reviewMessage = review['comment'];
  const reviewVersion = props.review_obj['version']
  const reactionsList = props.review_obj['reactions']
  const advanced = props.review_obj['advanced']
  const streakData = props.review_obj['user_streak_data']
  const trackData = (advanced) ? props.review_obj['trackData'] : null
  // Get user data for the current user
  const userData = await getUserData()

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
        temp = temp.replace(match, `<img src="${gifUrl}" frameborder="0" width="300" height="auto" class="max-w-300 h-full" />`);
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


  return (
    <div className="mx-auto" key={props.index}>
      <Popover 
        placement="bottom" 
        showArrow={true}
        shouldCloseOnScroll={false}
      >
        <PopoverTrigger>
          <div className="relative border border-gray-800 bg-black/20 rounded-2xl pt-1 pb-2 px-3 shadow-2xl transition-all hover:bg-black/40 hover:scale-105">
            <UserCard
              userDiscordID={review['user_id']}
              customDescription={
                <StarRating
                  rating={review['score']}
                  className="text-yellow-400"
                  textSize="text-xl xl:text-[29px]"
                />
              }
              avatarClassNameOverride="size-[40px]"
            />
            <div className="ml-12 line-clamp-1 max-h-[20px]">
              <div 
                className="prose prose-invert prose-sm text-gray-500" 
                dangerouslySetInnerHTML={{__html: reviewMessage}}
              />
            </div>
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="relative w-[330px] max-h-dvh"
        >
          <UserCard 
            userDiscordID={review['user_id']} 
            customDescription="View profile"
            isProfileLink
          />
          <div className="flex">
            <StarRating
              rating={review['score']}
              className="text-yellow-400 my-auto"
              textSize="text-2xl"
            />
          </div>
          {/* Display Review Tags */}
          <div className="flex gap-2 justify-center pb-1">
            <Conditional showWhen={review['first_listen'] == true}>
              <p className="bg-green-700/90 rounded-xl px-2 py-1 border border-green-500 text-black font-bold italic text-xs">
                First Time Listen
              </p>
            </Conditional>
            <Conditional showWhen={advanced}>
              <p className="bg-red-700/90 rounded-xl px-2 py-1 border border-red-500 text-black font-bold italic text-xs">
                Advanced Review
              </p>
            </Conditional>
            <Conditional showWhen={streakData && streakData['current_streak'] && (streakData['current_streak'] >= 3)}>
              <p className="bg-yellow-500/90 rounded-xl px-2 py-1 border border-yellow-500 text-black font-bold text-xs">
                🔥 {streakData ? streakData['current_streak'] : "--" } 
              </p>
            </Conditional>
          </div>
          {/* Conditional link display for Review Page with Advanced Reviews */}
          <Conditional showWhen={advanced}>
            <div className="w-full text-center h-fit pt-2 px-1">
              <Link
                href={`/dashboard/aotd/review/${review['id']}`}
                underline="hover"
                className="text-xs"
              >
                View Full Page Review
              </Link>
            </div>
          </Conditional>
          {/* Review Text */}
          <Conditional showWhen={advanced}>
            <p className="mt-[6px] text-lg mr-auto">Overall Review:</p>
          </Conditional>
          <div className="">
            <ScrollShadow className="w-[330px] max-h-[320px] overflow-y-scroll scrollbar-hide border rounded-xl border-neutral-800 bg-black/20" >
              <div 
                className="prose prose-invert prose-sm mx-2 p-1 pb-5" 
                dangerouslySetInnerHTML={{__html: reviewMessage}}
              />
            </ScrollShadow>
          </div>
          {/* Emoji Reactions Display */}
          <ReviewEmojiMartClientWrapper 
            userData={userData}
            reviewId={review['id']}
            albumMbid={review['album_id']}
            reactionsList={reactionsList}
          />
          {/* Advanced Review Display */}
          <Conditional showWhen={advanced}>
            <p className="mt-[6px] text-lg mr-auto ml-0">Track by Track:</p>
            <div className="max-h-[400px] overflow-x-auto rounded-lg">
              {
                parsedTrackComments.map(async(songObj: any) => (
                  <div 
                    key={songObj['number']}
                    className="text-left w-full py-[2px]"
                  >
                    <div className="flex justify-between w-full gap-1">
                      <p className="text-base ml-2 line-clamp-1">{songObj['number']}. {songObj['title']}</p>
                      <p className={`w-fit flex-shrink-0 rounded-2xl px-1 text-center text-black ${ratingToTailwindBgColor(songObj['cordpal_rating'] * 2)}`}><b>{songRatingToString(songObj['cordpal_rating'])}</b></p>
                    </div>
                    <Conditional showWhen={(songObj['cordpal_comment'] != "No Comment Provided...") && (songObj['cordpal_comment'] != "<p></p>")}>
                      <ScrollShadow className="w-[300px] max-h-[300px] overflow-y-scroll scrollbar-hide border rounded-xl border-neutral-800 bg-black/20" >
                        <div 
                          className="prose prose-invert prose-sm mx-2 p-1 pb-5" 
                          dangerouslySetInnerHTML={{__html: songObj['parsedComment']}}
                        />
                      </ScrollShadow>
                    </Conditional>
                  </div>
                ))
              }
            </div>
          </Conditional>
          {/* Tenor Disclaimer Display */}
          <div className="w-fit backdrop-blur-2xl px-2 py-1 rounded-2xl border border-neutral-800">
            <p className="text-sm italic my-auto">
              Gifs Provided via Tenor 
            </p>
          </div>
          {/* Timestamp Display */}
          <div className="flex justify-between w-full px-2 mt-2 align-middle gap-1">
            Submitted: <ClientTimestamp timestamp={review['review_date']} full={true} />
          </div>
          <Conditional showWhen={review['last_updated'] != review['review_date']}>
            <div className="flex justify-between w-full px-2 align-middle">
              Last Updated: <ClientTimestamp timestamp={review['last_updated']} full={true} />
            </div>
          </Conditional>
          <div className="w-full text-center h-fit pt-2 px-1">
            <Link
              href={`/dashboard/aotd/review/${review['id']}`}
              underline="hover"
              className="text-xs"
            >
              View Full Review on Review Page
            </Link>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}