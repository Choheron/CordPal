"use client"

import { Accordion, AccordionItem, Divider } from "@heroui/react"
import ClientTimestamp from "../../general/client_timestamp"
import { Conditional } from "../conditional"
import StarRating from "../../general/star_rating"
import { diff_match_patch } from 'diff-match-patch'
import { RiArrowRightLine } from "react-icons/ri"

export default function ReviewHistoryAccordion(props) {
  const review = props.review // Current review data 
  const reviewHistoryList = props.reviewHistoryList
  const listLen = reviewHistoryList.length


  // Function to change style of change viewer
  const calcAndShowDiffs = (index) => {
    if(index == (listLen - 1)) {
      return reviewHistoryList[index]['comment']
    }
    const dmp = new diff_match_patch()
    const diffs = dmp.diff_main(reviewHistoryList[index + 1]['comment'], reviewHistoryList[index]['comment'])
    dmp.diff_cleanupSemantic(diffs)

    const DIFF_DELETE = -1;
    const DIFF_INSERT = 1;
    const DIFF_EQUAL = 0;

    var html:any = [];
    for (var x = 0; x < diffs.length; x++) {
      var op = diffs[x][0];    // Operation (insert, delete, equal)
      var data = diffs[x][1];  // Text of change.
      var text = data
      switch (op) {
        case DIFF_INSERT:
          html[x] = '<span class="bg-green-400/30">' + text + '</span>';
          break;
        case DIFF_DELETE:
          html[x] = '<span class="bg-red-400/30 line-through">' + text + '</span>';
          break;
        case DIFF_EQUAL:
          html[x] = '<span>' + text + '</span>';
          break;
      }
    }
    return html.join('');
  };


  const mapReviewHistory = () => {
    return reviewHistoryList.map((hist, index) => {
      const result = calcAndShowDiffs(index)
      const currScore = hist['score']
      const prevScore = (index != (listLen - 1)) ? reviewHistoryList[index + 1]['score'] : null

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
                <Conditional showWhen={index == (0)}>
                  <p
                    className="text-xs my-auto border border-green-500 rounded-full px-1 ml-2 bg-green-600/80 italic text-black font-normal"
                  >
                    <b>Current</b>
                  </p>
                </Conditional>
                <Conditional showWhen={index == (reviewHistoryList.length - 1)}>
                  <p
                    className="text-xs my-auto border border-orange-500 rounded-full px-1 ml-2 bg-orange-600/80 italic text-black font-normal"
                  >
                    <b>Original</b>
                  </p>
                </Conditional>
              </div>
              <div className="text-xs italic font-extralight text-gray-500">
                <ClientTimestamp timestamp={hist['recorded_at']} full={true}/>
              </div>
            </div>
          }
        >
          {/* Display changes to score */}
          <div className="flex gap-1 text-base sm:text-lg md:text-2xl">
            <Conditional showWhen={(prevScore != null) && (prevScore != currScore)}>
              <StarRating
                rating={prevScore}
                textSize="text-inheret"
              />
              <RiArrowRightLine 
                className="text-gray-500 my-auto text-xs sm:text-base md:text-lg"
              />
            </Conditional>
            <StarRating
              rating={currScore}
              textSize="text-inheret"
            />
          </div>
          {/* Comment Content (Displays changes to comment) */}
          <div 
            className="w-full prose prose-invert prose-sm !max-w-none mb-2 font-normal"
            dangerouslySetInnerHTML={{__html: result}}
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
      <div className="w-fit max-w-full md:max-w-1/2 mx-auto px-2 py-2 my-2 text-small text-center italic border border-neutral-800 rounded-2xl bg-zinc-800/30">
        <p>Embeds will not be rendered in review history to save bandwidth and properly show edits. Please note that the current version is also displayed, for diff viewing ability.</p>
      </div>
      <Accordion
        selectionMode="multiple"
      >
        {mapReviewHistory()}
      </Accordion>
    </div>
  )
}