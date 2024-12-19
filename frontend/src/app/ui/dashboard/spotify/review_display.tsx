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
  // Regex for youtube video embedding (Thanks GPT)
  const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:\?[\w=&%-]*)?(?:&t=(\d+h)?(\d+m)?(\d+s)?)?/g;

  const generateEmbed = (textWithLinks) => {
    return textWithLinks.replace(youtubeRegex, (match, videoId, hours, minutes, seconds) => {
      // Convert timestamp to seconds
      const h = hours ? parseInt(hours) * 3600 : 0;
      const m = minutes ? parseInt(minutes) * 60 : 0;
      const s = seconds ? parseInt(seconds) : 0;
      const startTime = h + m + s;

      const startParam = startTime > 0 ? `?start=${startTime}` : '';
      return `<iframe width="300" height="168.75" src="https://www.youtube.com/embed/${videoId}${startParam}" frameborder="0" allowfullscreen></iframe>`;
    })
  };

  return (
    <div className="w-full lg:w-fit min-w-[300px] mx-2 lg:mx-1 my-2 flex flex-col gap-2">
      <div className="mx-auto">
        <p>User Reviews:</p>
      </div>
      {reviews.length === 0 ? (
          <p>No User Reviews Yet</p>
        ) : (
          reviews.sort((a, b) => a['score'] < b['score'] ? 1 : -1).map((review, index) => (
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
                  <div className="mx-2 my-2 max-w-[320px]" dangerouslySetInnerHTML={{__html: generateEmbed(review['comment'])}} />
                  <p className="mx-2 my-2 align-middle">
                    Submitted: {convertToLocalTZString(new Date(review['review_date']), true)}
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