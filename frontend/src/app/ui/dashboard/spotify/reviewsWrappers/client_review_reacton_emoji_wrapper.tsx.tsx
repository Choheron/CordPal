"use client"

import { addReviewReaction, getReviewByID } from "@/app/lib/spotify_utils"
import EmojiMartButton from "@/app/ui/general/input/emoji_mart_popover"
import { Conditional } from "../../conditional";
import { Tooltip } from "@heroui/react";
import { useEffect, useState } from "react";

// Special wrapper to allow for emoji mart reaction addition and display
// Merged reaction display and addition to increase speed of display
export default function ReviewEmojiMartClientWrapper(props) {
  const reviewID = props.reviewId
  const [reactionsList, setReactionsList] = useState((props.reactionsList) ? props.reactionsList : [])

  // Callback to add review to backend
  const handleSelection = async (emojiObj) => {
    const reviewReactionObj = {
      "id": reviewID,
      "emoji": emojiObj.native
    }
    const status = await addReviewReaction(reviewReactionObj)['status']
    // If successful, retrieve review data again
    setReactionsList((await getReviewByID(reviewID))['reactions'])
  }

  // UseEffect to get reviews
  useEffect(() => {
    const getReactions = async () => {
      setReactionsList((await getReviewByID(reviewID))['reactions'])
    }
    getReactions()
  }, [])

  return (
    <>
      {/* Reaction UI */}
      <div className="absolute -top-2 -right-2">
        <EmojiMartButton 
          selectionCallback={handleSelection}
        />
      </div>
      {/* Reaction Emoji Display */}
      <Conditional showWhen={reactionsList.length != 0}>
        <div className="flex flex-wrap w-full pt-1 gap-1">
          {reactionsList.map((emojiGroup, index) => {
            return (
              <Tooltip
                key={index}
                content={
                  <div className="flex flex-col">
                    {emojiGroup['objects'].map((obj, index) => {
                      return (
                        <p key={index}>{obj['user_data']['nickname']}</p>
                      )
                    })}
                  </div>
                }
              >
                <div 
                  key={index}
                  className="rounded-xl flex gap-1 px-2 py-1 bg-slate-700"
                >
                  <p className="text-base">{emojiGroup['emoji']}</p>
                  <p className="text-xs my-auto">{emojiGroup['count']}</p>
                </div>
              </Tooltip>
            )
          })}
        </div>
      </Conditional>
    </>
  )
}