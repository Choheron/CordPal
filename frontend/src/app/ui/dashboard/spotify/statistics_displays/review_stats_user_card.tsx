'use server'

import { Popover, PopoverTrigger, PopoverContent} from "@nextui-org/react"
import { Button, Link } from "@nextui-org/react"

import UserCard from "@/app/ui/general/userUiItems/user_card"
import StarRating from "@/app/ui/general/star_rating"
import { getAlbum, getAlbumOfTheDayData } from "@/app/lib/spotify_utils"
import { ratingToTailwindBgColor } from "@/app/lib/utils"

// User Card showing the review stats for a user
// Expected Props:
//   - userDiscordID: String - User Discord ID for backend handling
//   - userReviewObj: Object - Object containing the following data/format:
//        {
//          "discord_id": review.user.discord_id, # This is the same as the key, just for ease of reference 
//          "total_reviews": 0, 
//          "review_score_sum": 0,
//          "average_review_score": -1, # This will be calculated at the end
//          "lowest_score_given": -1,
//          "lowest_score_album": None,
//          "lowest_score_date": None,
//          "highest_score_given": -1,
//          "highest_score_album": None,
//          "highest_score_date": None,
//        }
export default async function ReviewStatsUserCard(props) {
  const reviewData = props.userReviewObj;
  const lowestReviewData = await getAlbum(reviewData['lowest_score_album'])
  const highestReviewData = await getAlbum(reviewData['highest_score_album'])

  function convertToHistoricalDate(reviewDate: string) {
    const dateArr = reviewDate.split(',')[0].split("/")
    return (dateArr[2] + "-" + dateArr[0] + "-" + dateArr[1])
  }

  return (
    <Popover placement="bottom" showArrow={true}>
      <PopoverTrigger>
        <div>
          <UserCard
            userDiscordID={reviewData['discord_id']}
            customDescription={
              <p>Click for review stats</p>
            }
          />
        </div>
      </PopoverTrigger>
      <PopoverContent>
        <UserCard 
          userDiscordID={props.userDiscordID}
          customDescription={
            <p>Review Statistics</p>
          }
        />
        <div className='flex justify-between w-full'>
          <p className="my-auto">Total Reviews Submitted:</p>
          <p className="my-auto px-2 py-1 bg-gray-800 rounded-full">
            {reviewData['total_reviews']}
          </p>
        </div>
        <div className='w-full'>
          <p className="my-auto">Average Aggregate Review Score:</p>
          <StarRating
            rating={reviewData['average_review_score']}
            className="text-yellow-400 text-lg my-auto justify-center"
          />
        </div>
        {/* Album Highest Stats */}
        <div className='w-full flex flex-col align-middle'>
          <p className="my-auto">Highest Rated Album:</p>
          <Button 
            as={Link}
            href={"/dashboard/spotify/historical/" + convertToHistoricalDate(reviewData['highest_score_date'])}
            radius="lg"
            className={`w-fit hover:underline text-white h-fit py-2 mx-auto ${ratingToTailwindBgColor(reviewData['highest_score_given'])} bg-opacity-50 shadow-lg`}
            variant="bordered"
          >
            <div>
              <img 
                src={highestReviewData['album_img_src']}
                className='h-[100px] w-[100px] rounded-2xl mx-auto'
                alt={`Album Cover for ${highestReviewData['title']} by ${highestReviewData['artist']['name']}`}
              />
              <StarRating 
                rating={reviewData['highest_score_given']} 
                className="text-yellow-400 text-lg my-auto justify-center" 
              />
            </div>
          </Button>
        </div>
        {/* Album Lowest Stats */}
        <div className='w-full flex flex-col align-middle'>
          <p className="my-auto">Lowest Rated Album:</p>
          <Button 
            as={Link}
            href={"/dashboard/spotify/historical/" + convertToHistoricalDate(reviewData['lowest_score_date'])}
            radius="lg"
            className={`w-fit hover:underline text-white h-fit py-2 mx-auto ${ratingToTailwindBgColor(reviewData['lowest_score_given'])} bg-opacity-50 shadow-lg`}
            variant="bordered"
          >
            <div>
              <img 
                src={lowestReviewData['album_img_src']}
                className='h-[100px] w-[100px] rounded-2xl mx-auto'
                alt={`Album Cover for ${lowestReviewData['title']} by ${lowestReviewData['artist']['name']}`}
              />
              <StarRating 
                rating={reviewData['lowest_score_given']} 
                className="text-yellow-400 text-lg my-auto justify-center" 
              />
            </div>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}