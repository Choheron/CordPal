"use server"

import {Popover, PopoverTrigger, PopoverContent} from "@heroui/popover";

import StarRating from "../../general/star_rating";
import UserCard from "../../general/userUiItems/user_card";

import ReviewPopoverContent from "./review_small_content";
import { doReviewEmbedReplacements } from "@/app/lib/review_utils";

// GUI Display for a single review as a popover/avatar combo
// Expected Props:
//  - review_obj: Object - Review Data Object
//  - index: Number - Index in list
export default async function ReviewAvatarCard(props) {
  const review = props.review_obj;
  const hideScores = props.hideScores ?? false;
  const reviewMessage = await (await doReviewEmbedReplacements(review)).message

  const cardContent = (
    <div className={`relative border border-gray-800 bg-black/20 rounded-2xl pt-1 pb-2 px-3 shadow-2xl transition-all overflow-hidden ${hideScores ? 'cursor-default' : 'hover:bg-black/40 hover:scale-105'}`}>
      <UserCard
        userDiscordID={review['user_id']}
        customDescription={
          hideScores ? (
            <p className="text-xs text-gray-500 italic">Score hidden</p>
          ) : (
            <StarRating
              rating={review['score']}
              className="text-yellow-400"
              textSize="text-2xl xl:text-[25px]"
            />
          )
        }
        avatarClassNameOverride="size-[40px]"
      />
      {!hideScores && (
        <div className="ml-12 line-clamp-1 max-h-[20px]">
          <div
            className="prose prose-invert prose-sm text-gray-500"
            dangerouslySetInnerHTML={{__html: reviewMessage}}
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="mx-auto" key={props.index}>
      {hideScores ? cardContent : (
        <Popover
          placement="bottom"
          showArrow={true}
          shouldCloseOnScroll={false}
        >
          <PopoverTrigger>{cardContent}</PopoverTrigger>
          <PopoverContent className="relative w-[330px] max-h-dvh">
            <ReviewPopoverContent reviewData={review} reviewMessage={reviewMessage}/>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}