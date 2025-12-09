"use client"

import { Tooltip } from "@heroui/react";

import { addReviewReaction, deleteReviewReaction, getReviewByID } from "@/app/lib/aotd_utils"
import EmojiMartButton from "@/app/ui/general/input/emoji_mart_popover"
import { Conditional } from "../../conditional";
import { useEffect, useState } from "react";

// Special wrapper to allow for emoji mart reaction addition and display
// Merged reaction display and addition to increase speed of display
// Expected Props:
//  - reviewId: String - Review ID (PK from backend)
//  - reactionsList: List(Objects) - List of Objects containing reaction data from backend
//  - userData: Object - User Data from Backend
//  - emojiButtonOverride: String - Tailwind override for emoji button
export default function ReviewEmojiMartClientWrapper(props) {
  const albumMbid = props.albumMbid
  const reviewID = props.reviewId
  const [reactionsList, setReactionsList] = useState((props.reactionsList) ? props.reactionsList : [])
  const userData = props.userData
  const userID = userData['guid']
  const emojiButtonOverride = (props.emojiButtonOverride) ? props.emojiButtonOverride : "absolute -top-2 -right-2"

  // Callback to add reaction to backend
  const handleSelection = async (emojiObj) => {
    const reviewReactionObj = {
      "id": reviewID,
      "emoji": (emojiObj.native) ? emojiObj.native : emojiObj.src,
      "album_mbid": albumMbid,
      "custom": (emojiObj.native) ? false : true,
    }
    const status = await addReviewReaction(reviewReactionObj)
    // If successful, retrieve review data again
    if(status == 200) {
      setReactionsList((await getReviewByID(reviewID))['reactions'])
    }
  }

  // Handle reaction click for quick add or delete
  const handleClick = async (emojiGroup, removeReact: boolean) => {
    let status = 0
    const reviewReactionObj = {
      "id": reviewID,
      "emoji": emojiGroup['emoji'],
      "react_id": (removeReact) ? emojiGroup['objects'].find(obj => {return obj["user_id"] == userID})['id'] : "--",
      "album_mbid": albumMbid,
      "custom": emojiGroup['custom'],
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

  const displayEmoji = (emojiObj, imgWidth = "20px") => {
    if(emojiObj['custom_emoji'] == true) {
      return (
        <img src={emojiObj['emoji']} width={imgWidth}/>
      )
    } else {
      return (emojiObj['emoji'])
    }
  }

  return (
    <>
      {/* Reaction UI */}
      <div className={emojiButtonOverride}>
        <EmojiMartButton 
          selectionCallback={handleSelection}
          isDisabled={reactionsList.length == 20}
        />
      </div>
      {/* Reaction Emoji Display */}
      <Conditional showWhen={reactionsList.length != 0}>
        <div className="flex flex-wrap w-full max-w-full pt-1 gap-1">
          {reactionsList.map((emojiGroup, index) => {
            const didThisReact = isUserInReactList(emojiGroup['objects'])
            return (
              <Tooltip
                key={index}
                content={
                  <div className="flex flex-col">
                    <p className="mx-auto text-2xl" >
                      {displayEmoji(emojiGroup['objects'][0], "40px")}
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
                  onClick={() => handleClick(emojiGroup, didThisReact)}
                >
                  <p className="text-base h-fit my-auto">{displayEmoji(emojiGroup['objects'][0])}</p>
                  <p className="text-xs my-auto">{emojiGroup['count']}</p>
                </div>
              </Tooltip>
            )
          })}
        </div>
        <Conditional showWhen={reactionsList.length == 20}>
          <p className="text-xs text-gray-500 w-full pl-1 pt-1 italic">Max number of distinct reactions reached.</p>
        </Conditional>
      </Conditional>
    </>
  )
}