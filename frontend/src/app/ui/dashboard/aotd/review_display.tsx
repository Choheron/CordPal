import { getReviewsForAlbum, getAotdUserCount, getAotdData, getAotdUserSettings } from "@/app/lib/aotd_utils";
import ReviewAvatarCard from "./review_avatar_card";
import { Conditional } from "../conditional";
import { Alert } from "@heroui/alert";
import { getHasReviewedToday } from "@/app/lib/user_utils";

// GUI Display for reviews of an album
// Expected Props:
//  - album_id: String - Album ID (mbid) to retrieve review
//  - date: String - Date in which the album provided was AOTD (Historical Support)
//  - historical: Boolean - Is this review display in a historical context 
export default async function ReviewDisplay(props) {
  // Setup Props (Query backend if no reviewlist is passed in)
  const reviews = (props.review_list != null) ? props.review_list : await getReviewsForAlbum(props.album_id, props.date);
  // Get count of users in website
  const userCount = await getAotdUserCount();
  // If the user is an AOTD participant, check if they are about to lose a review streak
  const aotdUserData = await getAotdData();
  // Props for hidescores
  const hideScore = (props.hideScore) ? props.hideScore : false
  // Check if user has reviewed today
  const reviewToday = await getHasReviewedToday();


  return (
    <div className="w-[320px] mx-auto my-2 flex flex-col flex-shrink-0 gap-2">
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
      <Conditional showWhen={(hideScore) && (!reviewToday)}>
        <Alert
          className="w-full gap-2 text-sm"
          color="default"
          radius="md"
          hideIcon={true}
        >
          <div className="flex gap-2">
            <p className="text-2xl">🎵</p>
            <p className="my-auto">
              Scores are hidden until you've had a chance to share yours. You can disable this in settings.
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
            <div className="mx-auto w-full max-w-full" key={index}>
              <ReviewAvatarCard index={index} review_obj={review} hideScores={hideScore} />
            </div>
          ))
        )
      }
    </div>
  )
}