'use client'

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Router from "next/router"

import { Accordion, AccordionItem, addToast, Button, Divider, Switch, Tooltip } from "@heroui/react";
import ReviewTipTap from "../../general/input/Tiptap";
import { Slider, SliderValue, Select, SelectItem, Checkbox } from "@heroui/react";
import { setReviewCookie, submitReviewToBackend } from "@/app/lib/aotd_utils";
import SimilarRatingsBox from "./tooltips/similar_ratings_box";
import { Conditional } from "../conditional";
import { ratingToTailwindBgColor } from "@/app/lib/utils";
import InfoPopover from "../../general/info_popover";


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
//  - user_data: Object - Data about the user
//  - hasUserSubmitted: Boolean - Boolean to determine if a review for this album by this user on this date exists in the backend
//  - isAdvanced: Boolean - Determines if a review is advanced
export default function AlbumReviewBox(props) {
  // Activate Router
  const router = useRouter();
  // State management
  const [rating, setRating] = useState((props.rating != null) ? props.rating : 5);
  const [comment, setComment] = useState((props.comment != null) ? props.comment : `<p>No Comment Provided...</p>`);
  const [collapsed, setCollapsed] = useState((props.rating != null) ? true : false)
  const [collapseTitle, setCollapseTitle] = useState((props.rating != null) ? `Expand to edit your ${rating} star Review` : "Leave a Review")
  // const [favSong, setFavSong] = useState<Selection>(new Set([]));
  const [isReady, setIsReady] = useState(false);
  const [isFirstListen, setIsFirstListen] = useState((props.first_listen != null) ? props.first_listen : false);
  const [advanced, setAdvanced] = useState((props.isAdvanced != null) ? props.isAdvanced : false)
  // Track if user has updated their review to be something different
  const [isReviewUpdated, setIsReviewUpdated] = useState(false);
  const [isAdvancedUpdated, setIsAdvancedUpdated] = useState(false);
  // Track Tooltip being open
  const [tooltipOpen, setTooltipOpen] = useState(false);
  // Prop validation
  const songList = (props.song_data) ? props.song_data : null
  // Album Scoring Prop Validation
  const [albumsByRating, setAlbumsByRating] = useState((props.similar_review_data != null) ? props.similar_review_data : {})
  // User Data retrieval
  const userData = props.user_data
  // Track individual song reviews if the user is doing an advanced review
  const [songReviewObj, setSongReviewObj] = useState(songList.reduce((prev,cur) => (
    {
      ...prev,
      [cur['title']]: {
        "number": cur['number'],
        "position": cur['position'],
        "title": cur['title'],
        "cordpal_rating": cur['cordpal_rating'],
        "cordpal_comment": cur['cordpal_comment']
      }
    }), {})
  )
  // Track loading state for submit review button
  const [awaitingResponse, setAwaitingResponse] = useState(false)

  // Get steps for song by song ratings
  const getSongSteps = () => {
    let steps: any = [
      {
        value: 0,
        label: "TRASH",
      },
      {
        value: 1,
        label: "Bad",
      },
      {
        value: 2,
        label: "Mid",
      },
      {
        value: 3,
        label: "Good",
      },
      {
        value: 4,
        label: "GAS",
      },
    ]
    return steps
  }

  // Get Numeric Steps
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

  const checkIfReviewUpdated = () => {
    if((rating != props.rating) || (comment != props.comment) || (isFirstListen != props.first_listen) || (advanced != props.isAdvanced) || (isAdvancedUpdated)) {
      return true
    }
    // Default return false
    return false
  }


  // UseEffect to ensure review cannot be updated unless something changes and update cookie
  useEffect(() => {
    if(checkIfReviewUpdated()) {
      setIsReviewUpdated(true)
      // Update reivew cookie if a change has been made
      setReviewCookie(comment, rating, props.album_id, isFirstListen)
    } else {
      setIsReviewUpdated(false)
    }
  }, [rating, comment, isFirstListen, songReviewObj])


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
    out['score'] = `${rating}`
    out['comment'] = comment 
    out['first_listen'] = isFirstListen
    out['userId'] = userData['discord_id']
    out['advanced'] = advanced
    if(advanced){
      out['trackData'] = songReviewObj
    }

    setIsReviewUpdated(false)
    setAwaitingResponse(true)
    const response = await submitReviewToBackend(out)
    // Toggle off waiting for response
    setAwaitingResponse(false)
    // Alert user based on response
    if(response.status == 200) {
      addToast({
        title: `Successfully submitted Review!`,
        description: `Your ${out['score']} star review has been submitted and confirmed!`,
        color: "success",
      })
    } else {
      addToast({
        title: `Failed to submit Review!`,
        description: `Review submission failure with the following HTTP error code: ${response.status}. Please contact server administrators with CRID: ${response.crid}.`,
        color: "danger",
      })
    }
    // Turn off review ready checkmark
    setIsReady(false)
    setCollapsed(true)
    // Refresh page
    router.refresh();
  }

  // Handle slider moving
  const handleSliderMove = (sliderValue) => {
    setRating(sliderValue)
  }

  // Handle a track review change for trackdata
  const handleTrackUpdate = (trackName, trackScore, trackComment) => {
    setSongReviewObj(
      {
        ...songReviewObj,
        [trackName]: {
          "number": songReviewObj[trackName]['number'],
          "title": trackName,
          "cordpal_rating": trackScore,
          "cordpal_comment": trackComment
        }
      }
    )
    setIsAdvancedUpdated(true)
  }

  return (
    <div  
      className="w-full px-2 lg:mx-auto py-2 mt-1 flex flex-col rounded-xl bg-zinc-800/30 border border-neutral-800"
      onMouseLeave={() => setTooltipOpen(false)}
    >
      <Accordion defaultExpandedKeys={(collapsed) ? [""] : ["1"]} isCompact>
        <AccordionItem key="1" aria-label="Accordion 1" title={collapseTitle}>
          <div className="w-full flex flex-col lg:flex-row gap-2 my-2 px-2 justify-between">
            <Switch 
              isSelected={advanced} 
              onValueChange={setAdvanced}
              isDisabled={songList == null}
            >
              Advanced Review
            </Switch>
          </div>
          {/* Advanced Review Display */}
          <Conditional showWhen={advanced}>
            <div>
              <div className="w-full backdrop-blur-2xl px-2 py-1 md:mx-2 my-2 md:my-0 rounded-2xl bg-black/20 border border-neutral-800">
                <p className="text-xs italic text-gray-300">
                  Advanced reviews allow you to give a song by song breakdown of an album, if you leave a song&apos;s comment unchanged it will not appear in the review but the stars will.
                </p>
              </div>
              <p className="text-2xl">Track by Track Breakdown:</p>
              <Divider />
              {
                songList.map((song, index) => (
                  <div 
                    key={index}
                    className="py-2"
                  >
                    <p className="text-lg">{song['number']}. <b>{song['title']}</b></p>
                    <div className="flex px-1">
                      <Slider   
                        size="sm"
                        radius="sm"
                        step={1}
                        marks={getSongSteps()}
                        color="warning"
                        maxValue={4}
                        minValue={0} 
                        value={songReviewObj[song['title']]['cordpal_rating']}
                        onChange={(rating) => handleTrackUpdate(song['title'], rating, songReviewObj[song['title']]['cordpal_comment'])}
                        renderThumb={(props) => (
                          <div
                            {...props}
                            className={`group p-1 top-1/2 bg-background border-small border-default-100 dark:border-default-400/50 shadow-medium rounded-full cursor-grab data-[dragging=true]:cursor-grabbing`}
                          >
                            <span className={`transition-transform shadow-small from-secondary-100 to-secondary-500 rounded-full w-5 h-5 block group-data-[dragging=true]:scale-80 ${ratingToTailwindBgColor(songReviewObj[song['title']]['cordpal_rating'] * 2)}`} />
                          </div>
                        )}
                        className="max-w-full px-5 mx-auto" 
                      />
                    </div>
                    <ReviewTipTap 
                      content={songReviewObj[song['title']]['cordpal_comment']}
                      updateCallback={(comment) => handleTrackUpdate(song['title'], songReviewObj[song['title']]['cordpal_rating'], comment)}
                    />
                  </div> 
                ))
              }
              <p className="text-2xl pt-2">Overall Review:</p>
              <Divider />
            </div>
          </Conditional>
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
                label={(advanced) ? "Overall Album Rating" : "Album Rating"}
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
          </div>
          <ReviewTipTap 
            content={comment}
            updateCallback={setComment}
          />
          <p className="text-xs mx-2 text-gray-400 mb-1">
            Enter an optional comment to go with your review of this album. Tenor links will be updated on the display end.
          </p>
          <div className="w-full flex flex-col lg:flex-row gap-2 justify-between">
            <Checkbox
              isSelected={isFirstListen}
              onValueChange={setIsFirstListen}
            >
              <div className="flex gap-1">
                First Time Listen
              </div>
            </Checkbox>
            <div className="flex flex-col gap-1">
              <Checkbox
                isSelected={isReady}
                onValueChange={setIsReady}
                isDisabled={!isReviewUpdated}
              >
                Ready to {(props.hasUserSubmitted)? "Update" : "Submit"}
              </Checkbox>
              <Button
                isDisabled={!isReady}
                onPress={submitReview}
                isLoading={awaitingResponse}
              >
                {(props.hasUserSubmitted)? "Update" : "Submit"} Review
              </Button>
            </div>
          </div>
        </AccordionItem>
      </Accordion>
    </div>
  );
}