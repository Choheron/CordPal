'use server'

import { getUserReviewStats } from "@/app/lib/spotify_utils";
import MinimalAlbumDisplay from "../dashboard/spotify/minimal_album_display";
import ReviewScoreCountBarChart from "../general/charts/review_score_bar_chart";

// Display user favorite and least favorite albums
// EXPECTED PROPS:
// - userId: String [REQUIRED] - Discord User ID for data fetching from backend
// - spotifyConnected: Boolean [REQUIRED] - Boolean if a user's spotify is connected, for security of site
export default async function UserAlbumFavDisplay(props) {
  const userId = props.userId
  const spotifyConnected = (props.spotifyConnected) ? props.spotifyConnected : false;
  // Get user fav and least fav album data
  // Review Stats Format:
  // {
  //   discord_id: '143849159747698689',
  //   total_reviews: 18,
  //   review_score_sum: 112,
  //   average_review_score: 6.222222222222222,
  //   lowest_score_given: 1,
  //   lowest_score_album: '0oaCI8xPjh0SvjoqyT4LT1',
  //   lowest_score_date: '12/19/2024, 15:07:22',
  //   highest_score_given: 10,
  //   highest_score_album: '3TSMSh5dai7WEnEGOoMXBZ',
  //   highest_score_date: '12/05/2024, 18:20:59'
  // }
  const reviewStats = await getUserReviewStats(userId); 

  return (
    <div className="w-full mx-auto flex flex-col gap-2 backdrop-blur-2xl px-2 py-2 my-2 rounded-2xl bg-zinc-800/30 border border-neutral-800 font-extralight">
      <p className="w-fit mx-auto text-xl underline">
        Album of the Day Stats
      </p>
      {(spotifyConnected) ? (
        <div>
          {/* Favorite and Hated Album Display */}
          <div className="flex justify-evenly">
            {/* Favorite Album Display */}
            <div className="w-fit">
              <p className="w-fit mx-auto">
                Favorite AOtD
              </p>
              <MinimalAlbumDisplay
                showAlbumRating={true}
                ratingOverride={reviewStats['highest_score_given']}
                title={reviewStats['highest_album']["title"]}
                album_spotify_id={reviewStats['highest_album']["spotify_id"]}
                album_img_src={reviewStats['highest_album']["album_img_src"]}
                album_src={reviewStats['highest_album']["spotify_url"]}
                artist={{"name": reviewStats['highest_album']["artist"], "href": reviewStats['highest_album']["artist_url"]}}
                submitter={reviewStats['highest_album']["submitter_id"]}
                submitter_comment={reviewStats['highest_album']["submitter_comment"]}
                submission_date={reviewStats['highest_album']["submission_date"]}
                historical_date={reviewStats['highest_album']['date']}
              />
            </div>
            {/* Hated Album Display */}
            <div className="w-fit">
              <p className="w-fit mx-auto">
                Hated AOtD
              </p>
              <MinimalAlbumDisplay
                showAlbumRating={true}
                ratingOverride={reviewStats['lowest_score_given']}
                title={reviewStats['lowest_album']["title"]}
                album_spotify_id={reviewStats['lowest_album']["spotify_id"]}
                album_img_src={reviewStats['lowest_album']["album_img_src"]}
                album_src={reviewStats['lowest_album']["spotify_url"]}
                artist={{"name": reviewStats['lowest_album']["artist"], "href": reviewStats['lowest_album']["artist_url"]}}
                submitter={reviewStats['lowest_album']["submitter_id"]}
                submitter_comment={reviewStats['lowest_album']["submitter_comment"]}
                submission_date={reviewStats['lowest_album']["submission_date"]}
                historical_date={reviewStats['lowest_album']['date']}
              />
            </div>
          </div>
          {/* Review Statistics Display */}
          <div className="flex flex-col">
            <p className="w-fit mx-auto">
              Review Stats
            </p>
            <div className="flex">
              <div className="w-1/2 h-80 -ml-3 mr-3">
                <ReviewScoreCountBarChart 
                  data={reviewStats['score_counts']}
                />
              </div>
            </div>
          </div>
        </div>
      ):(
        <div
          className="flex flex-col justify-around h-[125px] w-[250px] lg:h-[300px] lg:w-[600px]"
        >
          <p className="mx-auto w-fit text-xl -mt-5">User has not connected spotify!</p>
        </div>
      )}
    </div>
  )
}