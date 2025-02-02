import { getReviewsForAlbum, getSpotifyUserCount } from "@/app/lib/spotify_utils";
import ReviewAvatarCard from "./review_avatar_card";

// GUI Display for reviews of an album
// Expected Props:
//  - album_id: String - Spotify Album ID to retrieve review
export default async function ReviewDisplay(props) {
  // Setup Props
  const reviews = await getReviewsForAlbum(props.album_id)
  // Get count of users in website
  const userCount = await getSpotifyUserCount();

  return (
    <div className="w-full lg:w-fit min-w-[300px] mx-2 lg:mx-1 my-2 flex flex-col gap-2">
      <div className="flex mx-auto gap-3">
        <p>User Reviews:</p>
        <p>{reviews.length}/{userCount}</p>
      </div>
      {reviews.length === 0 ? (
          <p>No User Reviews Yet</p>
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