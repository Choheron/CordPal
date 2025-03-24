"use server"

import { RosenPieChart } from "@/app/ui/general/charts/rosen_pie_chart";
import { Divider, Tooltip } from "@heroui/react";
import { RiQuestionMark } from "react-icons/ri";

// Display the submission stats for a month in a pie chart, should only be called with the following props (to properly work)
// Expected Props:
//  - subData: Obj - Object containing submission data for the month
//  - year: String - Year of month
//  - monthName: String - Human readable month name
export default async function MonthlySubmissionCountsPie(props) {
  // Get props from parent component
  const subData = (props.subData) ? props.subData : null;
  const monthName = (props.monthName) ? props.monthName : null;
  const year = (props.year) ? props.year : null;
  // Get data from props
  const submission_total = subData['submission_total']
  // Map Submission Counts to Pie Chart Readable List 
  const submission_pie_chart_data = subData['submission_counts'].sort((a, b) => ((a["count"] < b["count"]) ? 1 : -1)).map((subObj, index) => {
    return(
      {
        "name": subObj['discord_id'],
        "nameType": 1,
        "value": subObj['count'],
        "percent": `${Number(subObj['percent']).toFixed(2)}%`,
      }
  )})

  // Display counts of user albums being selected
  return (
    <div className="relative h-full w-full lg:w-[500px] flex flex-col backdrop-blur-2xl pl-2 pr-4 py-2 my-2 rounded-2xl bg-zinc-800/30 border border-neutral-800">
      <p className="font-extralight w-full text-center text-xl mb-1">
        {monthName} {year} Submission Numbers:
      </p>
      <Divider />
      <div className="flex justify-between w-full px-3 font-extralight">
        <p>Total Submitted:</p>
        <p>{submission_total}</p>
      </div>
      <Divider />
      <div className="flex flex-col h-full mt-3">
        <RosenPieChart data={submission_pie_chart_data} />
      </div>
      {/* Top Left Tooltip */}
      <Tooltip content={`Breakdown of number of albums submitted, by user, for ${monthName} ${year}`} >
        <div className="absolute top-0 left-0 p-1 border-b border-r border-neutral-800 rounded-br-2xl rounded-tl-2xl bg-zinc-800/30 text-blue-800">
          <RiQuestionMark className="text-xl" />
        </div>
      </Tooltip>
    </div>
  )
}