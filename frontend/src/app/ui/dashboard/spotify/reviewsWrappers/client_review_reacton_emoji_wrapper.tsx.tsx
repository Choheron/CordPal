"use client"

import { addReviewReaction, deleteReviewReaction, getReviewByID } from "@/app/lib/spotify_utils"
import EmojiMartButton from "@/app/ui/general/input/emoji_mart_popover"
import { Conditional } from "../../conditional";
import { Tooltip } from "@heroui/react";
import { useEffect, useState } from "react";

// Special wrapper to allow for emoji mart reaction addition and display
// Merged reaction display and addition to increase speed of display
export default function ReviewEmojiMartClientWrapper(props) {
  const reviewID = props.reviewId
  const [reactionsList, setReactionsList] = useState((props.reactionsList) ? props.reactionsList : [])
  const userData = props.userData
  const userID = userData['guid']

  // Callback to add review to backend
  const handleSelection = async (emojiObj) => {
    const reviewReactionObj = {
      "id": reviewID,
      "emoji": emojiObj.native
    }
    const status = await addReviewReaction(reviewReactionObj)
    // If successful, retrieve review data again
    if(status == 200) {
      setReactionsList((await getReviewByID(reviewID))['reactions'])
    }
  }

  // Handle reaction click for quick add or delete
  const handleClick = async (emoji, removeReact: boolean) => {
    let status = 0
    const reviewReactionObj = {
      "id": reviewID,
      "emoji": emoji
    }
    if(removeReact) {
      status = await deleteReviewReaction(reviewReactionObj)
    } else {
      status = await addReviewReaction(reviewReactionObj)
    }
    if(status == 200) {
      setReactionsList((await getReviewByID(reviewID))['reactions'])
    }
  }

  // UseEffect to get reviews
  useEffect(() => {
    const getReactions = async () => {
      setReactionsList((await getReviewByID(reviewID))['reactions'])
    }
    getReactions()
  }, [])

  // Function to check if current user submitted a reaction
  const isUserInReactList = (reactList) => {
    for(let i = 0; i < reactList.length; i++) {
      const obj = reactList[i]
      if(obj['user_id'] == userID) {
        return true
      }
    }
    return false
  }

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
            const didThisReact = isUserInReactList(emojiGroup['objects'])
            return (
              <Tooltip
                key={index}
                content={
                  <div className="flex flex-col">
                    <p className="mx-auto text-2xl" >
                      {emojiGroup['emoji']}
                    </p>
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
                  className={`rounded-xl flex gap-1 px-2 py-1 border ${(didThisReact) ? "bg-blue-700/50 border-blue-500" : "bg-slate-700/50 border-slate-500"} hover:cursor-pointer hover:scale-105`}
                  onClick={() => handleClick(emojiGroup['emoji'], didThisReact)}
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