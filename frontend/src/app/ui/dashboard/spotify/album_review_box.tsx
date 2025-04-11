'use client'

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Router from "next/router"

import { Button, Tooltip } from "@heroui/react";
import ReviewTipTap from "../../general/input/Tiptap";
import { Slider, SliderValue, Select, SelectItem, Checkbox } from "@heroui/react";
import { submitReviewToBackend } from "@/app/lib/spotify_utils";
import SimilarRatingsBox from "./tooltips/similar_ratings_box";


// GUI Display for an Album Review Box
// Expected Props:
//  - album_id: String - Album ID (spotify ID)
//  - song_data: List of Objects - List of songs included in the album
//      > name: String - Name of Song
//  - rating: Float - (optional) User rating if they left a previous review
//  - fav_song: String - (optional) Favorite song if they left a previous review
//  - comment: String - (optional) User's comment if they left a previous review
//  - first_listen: Boolean - (optional) Status of first listen if they left a previous review 
//  - similar_review_data: Object - Object containing albums organized based on rating (key is rating)
export default function AlbumReviewBox(props) {
  // Activate Router
  const router = useRouter();
  // State management
  const [rating, setRating] = useState((props.rating != null) ? props.rating : 5);
  const [comment, setComment] = useState((props.comment != null) ? props.comment : `<p>No Comment Provided...</p>`);
  // const [favSong, setFavSong] = useState<Selection>(new Set([]));
  const [isReady, setIsReady] = useState(false);
  const [isFirstListen, setIsFirstListen] = useState((props.first_listen != null) ? props.first_listen : false);
  // Track if user has updated their review to be something different
  const [isReviewUpdated, setIsReviewUpdated] = useState(false);
  // Track Tooltip being open
  const [tooltipOpen, setTooltipOpen] = useState(false);
  // Prop validation
  const songList = (props.song_data) ? props.song_data : [{name: "None Provided"}]
  // Album Scoring Prop Validation
  const [albumsByRating, setAlbumsByRating] = useState((props.similar_review_data != null) ? props.similar_review_data : {})

  const getSteps = () => {
    let steps: any = []
    for(let i = 0; i < 11; i++) {
      steps.push({
        value: i,
        label: `${i}`,
      })
    }
    return steps
  }

  // UseEffect to ensure review cannot be updated unless something changes
  useEffect(() => {
    if((rating != props.rating) || (comment != props.comment) || (isFirstListen != props.first_listen)) {
      setIsReviewUpdated(true)
    } else {
      setIsReviewUpdated(false)
    }
  }, [rating, comment, isFirstListen])


  // UseEffect to stop users from navigating away if they have unsaved changes
  useEffect(() => {
    if (isReviewUpdated) {
      const routeChangeStart = () => {
        const ok = () => {
          return confirm("Warning! You have unsaved review changes that will be lost. Are you sure you would like to leave this page?")
        }
        if (!ok) {
          Router.events.emit("routeChangeError")
          throw "Abort route change. Please ignore this error."
        }
      }
      Router.events.on("routeChangeStart", routeChangeStart)

      return () => {
        Router.events.off("routeChangeStart", routeChangeStart)
      }
    }
  }, [isReviewUpdated])

  
  // Send request to upload the submitted image
  const submitReview = async () => {
    // Build out object
    let out = {}
    out['album_id'] = props.album_id
    out['score'] = rating
    out['comment'] = comment 
    out['first_listen'] = isFirstListen

    await submitReviewToBackend(out)
    // Turn off review ready checkmark
    setIsReady(false)
    setIsReviewUpdated(false)
    // Refresh page
    router.refresh();
  }

  // Handle slider moving
  const handleSliderMove = (sliderValue) => {
    setRating(sliderValue)
  }

  return (
    <div  
      className="w-full max-w-[1080px] px-2 lg:mx-auto py-2 mt-1 flex flex-col rounded-xl bg-zinc-800/30 border border-neutral-800"
      onMouseLeave={() => setTooltipOpen(false)}
    >
      <div 
        className="w-full flex flex-col lg:flex-row gap-2 justify-between"
        onMouseEnter={() => setTooltipOpen(true)}
        onMouseLeave={() => setTooltipOpen(false)}
      >
        <Tooltip 
          className="bg-transparent/85 border-gray-600"
          classNames={{ base: "pointer-events-none" }}
          offset={-10}
          content={
            <SimilarRatingsBox 
              rating={rating} 
              albums={albumsByRating[Number.parseFloat(rating).toFixed(1)]}
              timestamp={albumsByRating['metadata']['timestamp']} 
            />
          } 
          showArrow={true} 
          isOpen={tooltipOpen}
        >
          <Slider   
            size="md"
            radius="lg"
            step={0.5}
            marks={getSteps()}
            color="warning"
            label="Album Rating"
            hideValue={true}
            maxValue={10} 
            minValue={0} 
            value={rating}
            onChange={handleSliderMove}
            renderThumb={(props) => (
              <div
                {...props}
                className="group p-1 top-1/2 bg-background border-small border-default-100 dark:border-default-400/50 shadow-medium rounded-full cursor-grab data-[dragging=true]:cursor-grabbing"
              >
                <span className="transition-transform bg-yellow-600 shadow-small from-secondary-100 to-secondary-500 rounded-full w-5 h-5 block group-data-[dragging=true]:scale-80" />
              </div>
            )}
            className="max-w-full px-0 sm:px-10 mx-auto" 
          />
          </Tooltip>
        {/* <Select 
          label="Favorite Song" 
          className="max-w-full mx-auto my-auto" 
        >
          {songList.map((song) => (
            <SelectItem key={song.name}>
              {song.name}
            </SelectItem>
          ))}
        </Select> */}
      </div>
      <ReviewTipTap 
        content={comment}
        updateCallback={setComment}
      />
      <p className="text-xs mx-2 text-gray-400 mb-1">
        Enter an optional comment to go with your review of this album. Tenor links will be updated on the display end.
      </p>
      {/* 
        <Textarea
        className="my-2"
        label="Comment (Not Required)"
        minRows={1}
        description="Enter an optional comment to go with your review of this album. Youtube and Tenor links will automatically be updated to show in the review."
        value={comment}
        onValueChange={setComment}
      /> */}
      <div className="w-full flex flex-col lg:flex-row gap-2 justify-between">
        <Checkbox
          isSelected={isFirstListen}
          onValueChange={setIsFirstListen}
        >
          First Time Listen?
        </Checkbox>
        <div className="flex flex-col gap-1 ">
          <Checkbox
            isSelected={isReady}
            onValueChange={setIsReady}
            isDisabled={!isReviewUpdated}
          >
            Ready to {(props.rating != null)? "Update" : "Submit"}?
          </Checkbox>
          <Button
            isDisabled={!isReady}
            onPress={submitReview}
          >
            {(props.rating != null)? "Update" : "Submit"} Review
          </Button>
        </div>
      </div>
    </div>
  );
}