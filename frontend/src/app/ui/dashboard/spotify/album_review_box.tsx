'use client'

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@nextui-org/react";
import { Textarea } from "@nextui-org/input";
import { Slider, SliderValue, Select, SelectItem, Checkbox } from "@nextui-org/react";
import { submitReviewToBackend } from "@/app/lib/spotify_utils";

// GUI Display for an Album Review Box
// Expected Props:
//  - album_id: String - Album ID (spotify ID)
//  - song_data: List of Objects - List of songs included in the album
//      > name: String - Name of Song
//  - rating: Float - (optional) User rating if they left a previous review
//  - fav_song: String - (optional) Favorite song if they left a previous review
//  - comment: String - (optional) User's comment if they left a previous review
export default function AlbumReviewBox(props) {
  // Activate Router
  const router = useRouter();
  // State management
  const [rating, setRating] = useState<SliderValue>(5);
  const [comment, setComment] = useState("No Comment Provided");
  // const [favSong, setFavSong] = useState<Selection>(new Set([]));
  const [isReady, setIsReady] = useState(false);
  // Prop validation
  const songList = (props.song_data) ? props.song_data : [{name: "None Provided"}]

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

  // Send request to upload the submitted image
  const submitReview = () => {
    // Build out object
    let out = {}
    out['album_id'] = props.album_id
    out['score'] = rating
    out['comment'] = comment 

    submitReviewToBackend(out)
    // Turn off review ready checkmark
    setIsReady(false)
    // Reload page
    router.refresh()
  }

  return (
    <div className="w-full max-w-[640px] mx-2 px-2 lg:mx-1 my-2 py-2 flex flex-col rounded-xl bg-zinc-800/30 border border-neutral-800">
      <div className="w-full flex flex-col lg:flex-row gap-2 justify-between">
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
          onChange={setRating}
          className="max-w-md mx-auto" 
        />
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
      <Textarea
        className="my-2"
        label="Comment (Not Required)"
        minRows={1}
        description="Enter an optional comment to go with your review of this album."
        value={comment}
        onValueChange={setComment}
      />
      <div className="w-full flex flex-col lg:flex-row gap-2 justify-between">
        <Checkbox
          isSelected={isReady}
          onValueChange={setIsReady}
        >
          Ready to Submit?
        </Checkbox>
        <Button
          isDisabled={!isReady}
          onPress={submitReview}
        >
          Submit Review
        </Button>
      </div>
    </div>
  );
}