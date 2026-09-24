import StarRating from "../../general/star_rating";
import UserCard from "../../general/userUiItems/user_card";

import ReviewPopoverContent from "./review_small_content";
import { doReviewEmbedReplacements } from "@/app/lib/review_utils";
import { getReviewViewStatus } from "@/app/lib/aotd_utils";
import ReviewViewPopoverWrapper from "./reviewsWrappers/client_review_view_popover_wrapper";

// GUI Display for a single review as a popover/avatar combo
// Expected Props:
//  - review_obj: Object - Review Data Object
//  - index: Number - Index in list
export default async function ReviewAvatarCard(props) {
  const review = props.review_obj;
  const hideScores = props.hideScores ?? false;
  const viewData = (hideScores) ? ({'viewed': false}) : (await getReviewViewStatus(review['id']))
  const reviewMessage = await (await doReviewEmbedReplacements(review)).message
  const readOnly = (props.readOnly != null) ? props.readOnly : false 
  // PopoverTrigger calls Children.only, which throws if React streams the trigger's
  // subtree as a lazy reference — resolve the async UserCard before rendering
  const userCard = await UserCard({
    userDiscordID: review['user_id'],
    customDescription: hideScores ? (
      <p className="text-xs text-gray-500 italic">Score hidden</p>
    ) : (
      <StarRating
        rating={review['score']}
        className="text-yellow-400"
        textSize="text-2xl xl:text-[25px]"
      />
    ),
    avatarClassNameOverride: "size-[40px]",
  })

  // Custom displayEmoji function to display small emojis above the review card
  const displayEmoji = (emojiObj, imgWidth = "20px") => {
    if(emojiObj['custom_emoji'] == true) {
      return (
        <img src={emojiObj['emoji']} width={imgWidth} className="size-[14px] mx-auto my-auto"/>
      )
    } else {
      return (emojiObj['emoji'])
    }
  }

  const cardContent = (
    <div className={`relative border border-gray-800 bg-black/20 rounded-2xl pt-1 pb-2 px-3 shadow-2xl ${hideScores ? 'cursor-default' : ''}`}>
      {/* Display user card and current score */}
      {userCard}
      {!hideScores && (
        <div className="ml-12 max-h-[20px] line-clamp-1">
          <div
            className="prose prose-invert prose-sm text-gray-500"
            dangerouslySetInnerHTML={{__html: reviewMessage}}
          />
        </div>
      )}
      {/* Display Emoji Reactions on the review card as a small flair */}
      <div className="absolute -top-2 right-0 flex">
        {review['reactions'].slice(0, 6).map((reaction, index) => {
          return (
            <div key={`react-${index}`} className={`text-center pt-1 border-1 rounded-full size-[25px] text-xs border-gray-600 bg-black overflow-hidden -ml-2`}>
              {displayEmoji(reaction['objects'][0])}
            </div>
          )
        })}
      </div>
    </div>
  );

  return (
    <div className="mx-auto" key={props.index}>
      {hideScores ? cardContent : (
        <ReviewViewPopoverWrapper
          reviewId={review['id']}
          trigger={cardContent}
          viewData={viewData}
        >
          <ReviewPopoverContent
            reviewData={review}
            reviewMessage={reviewMessage}
            readOnly={readOnly}
          />
        </ReviewViewPopoverWrapper>
      )}
    </div>
  )
}