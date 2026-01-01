"use server"

import { doReviewEmbedReplacements } from "@/app/lib/review_utils";
import { Link } from "@heroui/link";
import { ScrollShadow } from "@heroui/scroll-shadow";

import ClientTimestamp from "../../general/client_timestamp";
import { Conditional } from "../conditional";
import ReviewEmojiMartClientWrapper from "./reviewsWrappers/client_review_reacton_emoji_wrapper.tsx";
import { ratingToTailwindBgColor, songRatingToString } from "@/app/lib/utils";

import StarRating from "../../general/star_rating";
import UserCard from "../../general/userUiItems/user_card";
import { getUserData } from "@/app/lib/user_utils";

export default async function ReviewPopoverContent(props) {
  const review = props.reviewData
  const reviewMessage = (props.reviewMessage) ? props.reviewMessage : (await doReviewEmbedReplacements(review)).message; // Only do embed replacements if its not provided
  const readOnly = (props.readOnly) ? props.readOnly : false

  const reviewVersion = review['version']
  const reactionsList = review['reactions']
  const advanced = review['advanced']
  const parsedTrackComments = (advanced) ? (await doReviewEmbedReplacements(review)).parsedComments : [];
  const streakData = review['user_streak_data']
  const trackData = (advanced) ? review['trackData'] : null
  // Get user data for the current user
  const userData = await getUserData()

  return (
    <div className="flex flex-col items-center pt-1">
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
      <div className={`${(readOnly) ? "pointer-events-none" : ""} w-full`}>
        <ReviewEmojiMartClientWrapper 
          userData={userData}
          reviewId={review['id']}
          albumMbid={review['album_id']}
          reactionsList={reactionsList}
        />
      </div>
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
    </div>
  )
}