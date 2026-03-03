"use server"

import { Divider } from "@heroui/divider";
import { Tooltip } from "@heroui/tooltip";

import { RosenPieChart } from "@/app/ui/general/charts/rosen_pie_chart";
import { RiQuestionMark } from "react-icons/ri";

// Expected Props:
//  - chartData: Object, specifically for use with CordPal Playback from file: frontend/src/app/ui/playback/global_aotd_playback.tsx
//  - title_text: str
export default async function BasicPieChart(props) {
  const title_text = props['title_text']
  const tooltip_text = props['tooltip_text']
  const year = props['year']
  // Pull table data from props 
  const selection_pie_chart_data = props['chartData'].sort((a, b) => ((a["count"] < b["count"]) ? 1 : -1)).map((subObj, index) => {
    return(
      {
        "name": subObj['userid'],
        "nameType": 1,
        "value": subObj['count'],
        "percent": subObj['percentage'],
      }
  )})

  // Display counts of user albums being selected
  return (
    <div className="relative h-auto w-full flex flex-col backdrop-blur-2xl px-4 py-2 my-2 rounded-2xl bg-gradient-to-bl from-slate-900 to-slate-950 border border-neutral-800">
      {(title_text) ? (
        <>
          <div className="flex justify-between w-full px-3 font-extralight">
            <p>{title_text}</p>
          </div>
          <Divider />
        </>
      ):(
        <></>
      )}
      <div className="flex flex-col h-full mt-3">
        <RosenPieChart data={selection_pie_chart_data} />
      </div>
      {/* Top Left Tooltip */}
      <Tooltip content={tooltip_text} >
        <div className="absolute top-0 left-0 p-1 border-b border-r border-neutral-800 rounded-br-2xl rounded-tl-2xl bg-zinc-800/30 text-blue-800">
          <RiQuestionMark className="text-xl" />
        </div>
      </Tooltip>
    </div>
  )
}