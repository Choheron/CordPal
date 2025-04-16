"use client"

import { useState } from "react"
import ReviewScoreCountBarChart from "../general/charts/review_score_bar_chart"
import ClientTimestamp from "../general/client_timestamp"
import { Tooltip } from "@heroui/react"

// Box display review stats and reviews in a dynmic chart list combo
// Expected Props:
// - reviewStats: Object - Object containing counts and review stats
// - reviewsObj: Object - An object containing all user reviews for all AOtD Appearances
export default function ReviewCountChartBox(props) {
  // Prop Validation
  const reviewStats = props.reviewStats
  const reviewList = props.reviewsObj['reviews']
  const reviewListTimestamp = props.reviewsObj['metadata']['timestamp']
  // States for display management
  const [score, setScore] = useState(5);

  const displayReviews = () => {
    return reviewList.filter((rev) => (rev.score==score)).sort((a,b) => ((a['review_date'] < b['review_date']) ? 1 : -1)).map((review, index) => {
      const album = review['album']

      return (
        <div 
          className="flex h-[135px] w-[135px] m-1"
          key={index}  
        >
          <Tooltip 
            content={
              <div className="w-[135px]">
                <p className="text-center text-md line-clamp-2">
                  <b>{album['title']}</b>
                </p>
                <p className="text-center text-xs italic text-wrap">
                  {album['artist']}
                </p>
                <div className="text-center text-xs italic text-wrap">
                  <ClientTimestamp timestamp={review['review_date']} />
                </div>
              </div>
            }
          >
          <a 
            href={`/dashboard/spotify/review/${review['id']}`}
            className="flex flex-col h-full w-full justify-center py-0 mx-1"
          >
            <img 
              src={album['album_img_src']}
              className='h-full w-full rounded-2xl mx-auto group-hover:blur-sm duration-700 ease-in-out group-hover:brightness-50'
              alt={`Album Cover for ${album['title']} by ${album['artist']}`}
            />
          </a>
          </Tooltip>
          
            {/* <p className="text-center text-md line-clamp-2">
              <b>{album['title']}</b>
            </p>
            <p className="text-center text-sm italic text-wrap">
              {album['artist']}
            </p>
            <div className="text-center text-sm italic text-wrap">
              <ClientTimestamp timestamp={review['review_date']} />
            </div>
          </a> */}
        </div>
      )
    })
  }


  return (
    <div className="flex w-full h-fit">
      <div className="h-80 -ml-5 mr-3 w-1/2">
        <ReviewScoreCountBarChart
          data={reviewStats['score_counts']}
          dataCallback={setScore}
          defaultIndex={score*2}
        />
      </div>
      <div className="w-1/2 rounded-2xl bg-black/30 border border-neutral-800 -pb-10">
        <p className="w-full text-center rounded-tl-2xl rounded-tr-2xl bg-black/50">
          Reviews with a Score of: {score}
        </p>
        <div className="relative h-[92%] bg-black/90 rounded-b-2xl">
          <div className="absolute flex flex-wrap justify-around max-w-full max-h-full overflow-auto scrollbar-hide mx-2">
            {displayReviews()}
          </div>
        </div>
      </div>
    </div>
  )
}