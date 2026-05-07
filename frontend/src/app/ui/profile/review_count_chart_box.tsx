import { Tooltip } from "@heroui/tooltip"
import ClientTimestamp from "../general/client_timestamp"
import { ratingToHexColor } from "@/app/lib/utils"
import ReviewScoreCountBarChart from "../general/charts/review_score_bar_chart"

// Box display review stats and reviews in a dynmic chart list combo
// Expected Props:
// - reviewStats: Object - Object containing counts and review stats
// - reviewsObj: Object - An object containing all user reviews for all AOtD Appearances
export default function ReviewCountChartBox(props) {
  // Prop Validation
  const reviewStats = props.reviewStats
  const reviewList = props.reviewsObj['reviews']
  const reviewListTimestamp = props.reviewsObj['metadata']['timestamp']

   const displayReviews = (man_score) => {
    return reviewList.filter((rev) => (rev.score==man_score)).sort((a,b) => ((a['review_date'] < b['review_date']) ? 1 : -1)).map((review, index) => {
      const album = review['album']

      return (
        <div 
          className="flex h-[80px] w-[80px] m-1 flex-shrink-0 my-auto"
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
            href={`/dashboard/aotd/review/${review['id']}`}
            className="flex flex-col h-full w-full justify-center py-0"
          >
            <img 
              // src={album['cover_url']}
              src={`/dashboard/aotd/api/album-cover/${album['mbid']}`}
              className='h-full w-full rounded-2xl mx-auto group-hover:blur-sm duration-700 ease-in-out group-hover:brightness-50'
              alt={`Album Cover for ${album['title']} by ${album['artist']}`}
            />
          </a>
          </Tooltip>
        </div>
      )
    })
  }


  return (
    <>
      <div className="h-80 w-3/4 mt-1 ml-5">
        <ReviewScoreCountBarChart
          data={reviewStats['score_counts']}
        />
      </div>
      <div className="mx-2 sm:mx-10 my-6 flex flex-col gap-2">
        <p className="text-sm font-semibold uppercase tracking-widest text-neutral-400 mb-1">Rating Breakdown</p>
        {reviewStats['score_counts'].map((countObj, index) => {
          const thisObj = reviewStats['score_counts'][reviewStats['score_counts'].length - (index+1)]
          return (
            <div key={index} className="flex items-center rounded-xl overflow-hidden bg-white/5 border border-white/5">
              <p className="text-base sm:text-2xl font-bold w-10 sm:w-16 text-center flex-shrink-0" style={{ color: ratingToHexColor(thisObj['score']) }}>
                {thisObj['score']}
              </p>
              <p className="text-xs text-center text-neutral-400 w-10 sm:w-20 flex-shrink-0">{thisObj['count']} album{thisObj['count'] !== 1 ? 's' : ''}</p>
              <div
                className="overflow-x-auto flex items-center h-[96px] rounded-xl py-1 w-0 flex-1 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/20"
                style={{ backgroundColor: ratingToHexColor(thisObj['score']) + '1A' }}
              >
                {displayReviews(thisObj['score'])}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}