"use server"

import {Popover, PopoverTrigger, PopoverContent} from "@heroui/popover";

import StarRating from "../../general/star_rating";
import UserCard from "../../general/userUiItems/user_card";

import { getTenorGifData } from "@/app/lib/spotify_utils";
import ClientTimestamp from "../../general/client_timestamp";
import { Conditional } from "../conditional";
import { Link, ScrollShadow, Tooltip } from "@heroui/react";
import ReviewEmojiMartClientWrapper from "./reviewsWrappers/client_review_reacton_emoji_wrapper.tsx";
import { getUserData } from "@/app/lib/user_utils";

// GUI Display for a single review as a popover/avatar combo
// Expected Props:
//  - review_obj: Object - Review Data Object
//  - index: Number - Index in list
export default async function ReviewAvatarCard(props) {
  const review = props.review_obj;
  var reviewMessage = review['comment'];
  const reviewVersion = props.review_obj['version']
  const reactionsList = props.review_obj['reactions']
  // Get user data for the current user
  const userData = await getUserData()

  // Regex for youtube video embedding
  const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:\?[\w=&%-]*)?(?:&t=(\d+h)?(\d+m)?(\d+s)?)?/g;
  // Regex for tenor gif embedding
  const tenorRegex = /(?:https?:\/\/)?(?:www\.)?tenor\.com\/view\/[a-zA-Z0-9_-]+-(\d+)/g;

  // Parse Review Text
  if(reviewVersion == 1) {
    // Do youtube link replacements [ONLY IF THIS IS A VERSION 1 REVIEW]
    reviewMessage =  reviewMessage.replace(youtubeRegex, (match, videoId, hours, minutes, seconds) => {
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
  const tenorMatches = [...reviewMessage.matchAll(tenorRegex)];
  if (tenorMatches.length > 0) {
    // Fetch all Tenor GIF URLs asynchronously
    const gifPromises = tenorMatches.map(async ([match, gifId]) => {
      const gifUrl = await getTenorGifData(gifId);
      return { match, gifUrl };
    });

    const gifResults = await Promise.all(gifPromises);

    // Replace Tenor URLs with their corresponding <img> tags
    gifResults.forEach(({ match, gifUrl }) => {
      reviewMessage = reviewMessage.replace(match, `<img src="${gifUrl}" frameborder="0" width="300" height="auto" class="max-w-300 h-full" />`);
    });
  }
  

  return (
    <div className="mx-auto" key={props.index}>
      <Popover 
        placement="bottom" 
        showArrow={true}
        shouldCloseOnScroll={false}
      >
        <PopoverTrigger>
          <div>
            <UserCard
              userDiscordID={review['user_id']}
              customDescription={
                <StarRating
                  rating={review['score']}
                  className="text-yellow-400"
                  textSize="text-xl xl:text-2xl"
                />
              }
              avatarClassNameOverride="size-[40px]"
            />
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="relative w-[338px]"
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
          <Conditional showWhen={review['first_listen'] == true}>
            <p className="bg-green-700/90 rounded-xl px-2 py-1 border border-green-500 text-black font-bold italic text-xs">
              First Time Listen
            </p>
          </Conditional>
          {/* Review Text */}
          <div className="mt-[6px]">
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
            albumSpotifyID={review['album_id']}
            reactionsList={reactionsList}
          />
          {/* Tenor Disclaimer Display */}
          <Conditional showWhen={tenorMatches.length > 0}>
            <div className="w-fit backdrop-blur-2xl px-2 py-1 rounded-2xl border border-neutral-800">
              <p className="text-sm italic my-auto">
                Gifs Provided via Tenor 
              </p>
            </div>
          {/* Timestamp Display */}
          </Conditional>
          <div className="flex justify-between w-full px-2 mt-2 align-middle gap-1">
            Submitted: <ClientTimestamp timestamp={review['review_date']} full={true} />
          </div>
          <Conditional showWhen={review['last_updated'] != review['review_date']}>
            <div className="flex justify-between w-full px-2 align-middle">
              Last Updated: <ClientTimestamp timestamp={review['last_updated']} full={true} />
            </div>
          </Conditional>
          <div className="w-full text-right h-fit pt-2 px-1">
            <Link
              href={`/dashboard/spotify/review/${review['id']}`}
              underline="hover"
              className="text-xs"
            >
              View Full Review
            </Link>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}