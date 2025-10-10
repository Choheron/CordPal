import { getReviewsForAlbum, getAotdUserCount, getAotdData } from "@/app/lib/aotd_utils";
import ReviewAvatarCard from "./review_avatar_card";
import { Conditional } from "../conditional";
import { Alert } from "@heroui/react";

// GUI Display for reviews of an album
// Expected Props:
//  - album_id: String - Spotify Album ID to retrieve review
//  - date: String - Date in which the album provided was AOTD (Historical Support)
//  - historical: Boolean - Is this review display in a historical context 
export default async function ReviewDisplay(props) {
  // Setup Props (Query backend if no reviewlist is passed in)
  const reviews = (props.review_list != null) ? props.review_list : await getReviewsForAlbum(props.album_id, props.date);
  // Get count of users in website
  const userCount = await getAotdUserCount();
  // If the user is an AOTD participant, check if they are about to lose a review streak
  const aotdUserData = await getAotdData();


  return (
    <div className="w-[320px] my-2 flex flex-col flex-shrink-0 gap-2">
      <div className="flex mx-auto gap-3">
        <p>User Reviews:</p>
        <p>{reviews.length}/{userCount}</p>
      </div>
      <Conditional showWhen={aotdUserData['streak_at_risk'] && (aotdUserData['current_streak'] > 2) && (props.historical != true)}>
        <Alert
          className="w-full gap-2 text-sm"
          color="warning"
          radius="md"
          hideIcon={true}
        >
          <div className="flex gap-2">
            <p className="text-2xl">⚠️</p>
            <p className="my-auto">
              Review by midnight CT to keep your {aotdUserData['current_streak']}-day streak!
            </p>
          </div>
        </Alert>
      </Conditional>
      {reviews.length === 0 ? (
          <div className="w-full text-center">
            <p className="mx-auto font-extralight pt-10">No Reviews.</p>
          </div>
        ) : (
          reviews.sort((a, b) => a['score'] < b['score'] ? 1 : -1).map((review, index) => (
            <div className="mx-auto" key={index}>
              <ReviewAvatarCard index={index} review_obj={review} />
            </div>
          ))
        )
      }
    </div>
  )
}