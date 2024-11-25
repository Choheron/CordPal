import {Popover, PopoverTrigger, PopoverContent} from "@nextui-org/popover";

import StarRating from "../../general/star_rating";
import UserCard from "../../general/userUiItems/user_card";

import { convertToLocalTZString } from "@/app/lib/utils";
import { getReviewsForAlbum } from "@/app/lib/spotify_utils";

// GUI Display for reviews of an album
// Expected Props:
//  - album_id: String - Spotify Album ID to retrieve review
export default async function ReviewDisplay(props) {
  // Setup Props
  const reviews = await getReviewsForAlbum(props.album_id)

  return (
    <div className="w-full lg:w-fit min-w-[300px] mx-2 lg:mx-1 my-2 flex flex-col gap-2">
      <div className="mx-auto">
        <p>User Reviews:</p>
      </div>
      {reviews.length === 0 ? (
          <p>No User Reviews Yet</p>
        ) : (
          reviews.map((review, index) => (
            <div className="mx-auto" key={index}>
              <Popover placement="bottom" showArrow={true}>
                <PopoverTrigger>
                  <div>
                    <UserCard
                      userDiscordID={review['user_id']}
                      customDescription={
                        <StarRating
                          rating={review['score']}
                          className="text-yellow-400 text-lg"
                        />
                      }
                    />
                  </div>
                </PopoverTrigger>
                <PopoverContent>
                  <UserCard userDiscordID={review['user_id']} />
                  <div className="flex">
                    <p className="mx-2 my-2 align-middle">Rating:</p>
                    <StarRating
                      rating={review['score']}
                      className="text-yellow-400 text-lg my-auto"
                    />
                  </div>
                  <p className="ml-2 mr-auto">
                    <b>Comment:</b>
                  </p>
                  <p className="mx-2 my-2 max-w-[320px]">{review['comment']}</p>
                  <p className="mx-2 my-2 align-middle">
                    Submitted: {convertToLocalTZString(new Date(review['review_date']))}
                  </p>
                </PopoverContent>
              </Popover>
            </div>
          ))
        )
      }
    </div>
  )
}