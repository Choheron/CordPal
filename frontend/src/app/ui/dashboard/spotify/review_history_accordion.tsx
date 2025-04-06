"use client"

import { Accordion, AccordionItem, Divider } from "@heroui/react"
import ClientTimestamp from "../../general/client_timestamp"
import { Conditional } from "../conditional"
import StarRating from "../../general/star_rating"

export default function ReviewHistoryAccordion(props) {
  const reviewHistoryList = props.reviewHistoryList
  const listLen = reviewHistoryList.length

  const mapReviewHistory = () => {
    return reviewHistoryList.map((hist, index) => {
      return (
        <AccordionItem 
          key={index} 
          aria-label={`Version ${listLen - index}`} 
          title={
            <div>
              <div className="flex gap-1">
                <p>Version {listLen - index}</p>
                <p>-</p>
                <div className="my-auto">
                  <StarRating 
                    rating={hist['score']}
                  />
                </div>
                <Conditional showWhen={index == 0}>
                  <p
                    className="text-xs my-auto border border-green-500 rounded-full px-1 ml-2 bg-green-600/80 italic text-black font-normal"
                  >
                    <b>Current</b>
                  </p>
                </Conditional>
              </div>
              <div className="text-xs italic font-extralight text-gray-500">
                <ClientTimestamp timestamp={hist['recorded_at']} full={true}/>
              </div>
            </div>
          }
        >
          {/* Comment Content */}
          <div 
            className="w-full prose prose-invert prose-sm !max-w-none mb-2 font-normal"
            dangerouslySetInnerHTML={{__html: hist['comment']}}
          />
          {/* Submission Timestamp */}
          <div className="text-right text-sm font-extralight text-gray-500">
            <ClientTimestamp timestamp={hist['recorded_at']} full={true}/>
          </div>
        </AccordionItem>
      )
    })
  }

  return (
    <div className="w-full mt-12">
      <p className="text-lg">
        <b>Review Update History</b>
      </p>
      <Divider />
      <div className="w-fit mx-auto px-2 py-2 my-2 text-small text-center italic border border-neutral-800 rounded-2xl bg-zinc-800/30">
        <p>Embeds will not be rendered in review history to save bandwidth and properly show edits. Please note that the current version is also displayed.</p>
      </div>
      <Accordion
        selectionMode="multiple"
      >
        {mapReviewHistory()}
      </Accordion>
    </div>
  )
}