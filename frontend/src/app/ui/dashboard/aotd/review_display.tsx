import { getReviewsForAlbum, getSpotifyUserCount } from "@/app/lib/aotd_utils";
import ReviewAvatarCard from "./review_avatar_card";

// GUI Display for reviews of an album
// Expected Props:
//  - album_id: String - Spotify Album ID to retrieve review
//  - date: String - Date in which the album provided was AOTD (Historical Support)
export default async function ReviewDisplay(props) {
  // Setup Props (Query backend if no reviewlist is passed in)
  const reviews = (props.review_list != null) ? props.review_list : await getReviewsForAlbum(props.album_id, props.date);
  // Get count of users in website
  const userCount = await getSpotifyUserCount();

  return (
    <div className="w-full min-w-[250px] max-w-full my-2 flex flex-col flex-shrink-0 gap-2">
      <div className="flex mx-auto gap-3">
        <p>User Reviews:</p>
        <p>{reviews.length}/{userCount}</p>
      </div>
      {reviews.length === 0 ? (
          <div className="w-full text-center">
            <p className="mx-auto font-extralight pt-10">No Reviews... Yet...</p>
            <p className="mx-auto font-extralight text-sm pt-10">Be the change you with to see, Submit your review now!</p>
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