"use client"

import { Accordion, AccordionItem, Divider } from "@heroui/react"

import ClientTimestamp from "../../general/client_timestamp"
import { Conditional } from "../conditional"
import { diff_match_patch } from 'diff-match-patch'

// Displays the edit history for an album's comment, structured
// identically to ReviewHistoryAccordion. Index 0 = current, last = original.
// Props:
//   - historyList: Array of { user_comment, recorded_at, edited_by_nickname }
//     The first entry represents the current state (recorded_at may be null).
export default function SubmissionHistoryAccordion(props) {
  const historyList = props.historyList
  const listLen = historyList.length

  // Build an inline diff HTML string between two plain-text comments.
  // For the original version (no previous entry to diff against) returns the raw text.
  const calcAndShowDiffs = (index: number): string => {
    if (index === listLen - 1) {
      // Oldest entry — nothing to diff against, just show the text
      return historyList[index]['user_comment'] ?? ''
    }
    const dmp = new diff_match_patch()
    const diffs = dmp.diff_main(historyList[index + 1]['user_comment'] ?? '', historyList[index]['user_comment'] ?? '')
    dmp.diff_cleanupSemantic(diffs)

    const DIFF_DELETE = -1
    const DIFF_INSERT = 1

    const html: string[] = []
    for (let x = 0; x < diffs.length; x++) {
      const op = diffs[x][0]
      // Escape HTML so raw comment text can't inject markup
      const text = diffs[x][1].replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      if (op === DIFF_INSERT) {
        html[x] = `<span class="bg-green-400/50">${text}</span>`
      } else if (op === DIFF_DELETE) {
        html[x] = `<span class="bg-red-400/50 line-through">${text}</span>`
      } else {
        html[x] = `<span>${text}</span>`
      }
    }
    return html.join('')
  }

  const mapHistory = () => {
    return historyList.map((entry, index) => {
      const versionNumber = listLen - index
      return (
        <AccordionItem
          key={index}
          aria-label={`Version ${versionNumber}`}
          title={
            <div>
              <div className="flex gap-1 flex-wrap">
                <p>Version {versionNumber}</p>
                <Conditional showWhen={index === 0}>
                  <p className="text-xs my-auto border border-green-500 rounded-full px-1 ml-2 bg-green-600/80 italic text-black font-normal">
                    <b>Current</b>
                  </p>
                </Conditional>
                <Conditional showWhen={index === listLen - 1 && listLen > 1}>
                  <p className="text-xs my-auto border border-orange-500 rounded-full px-1 ml-2 bg-orange-600/80 italic text-black font-normal">
                    <b>Original</b>
                  </p>
                </Conditional>
                {entry['edited_by_nickname'] && (
                  <p className="text-xs my-auto italic text-gray-400 font-normal">
                    edited by {entry['edited_by_nickname']}
                  </p>
                )}
              </div>
              <Conditional showWhen={entry['created_at'] !== null}>
                <div className="text-xs italic font-extralight text-gray-500">
                  <ClientTimestamp timestamp={entry['created_at']} full={true} />
                </div>
              </Conditional>
            </div>
          }
        >
          {/* Inline diff between this version and the one before it */}
          <div
            className="w-full whitespace-pre-wrap text-sm font-normal mb-2 break-words"
            dangerouslySetInnerHTML={{ __html: calcAndShowDiffs(index) }}
          />
          <Conditional showWhen={entry['created_at'] !== null}>
            <div className="text-right text-sm font-extralight text-gray-500">
              <ClientTimestamp timestamp={entry['created_at']} full={true} />
            </div>
          </Conditional>
        </AccordionItem>
      )
    })
  }

  return (
    <div className="relative lg:max-w-[1080px] w-full mt-2 backdrop-blur-2xl px-2 py-2 my-2 rounded-2xl bg-zinc-800/30 border border-neutral-800">
      <p className="text-lg">
        <b>Album Comment History</b>
      </p>
      <Divider />
      <Accordion selectionMode="multiple">
        {mapHistory()}
      </Accordion>
    </div>
  )
}
