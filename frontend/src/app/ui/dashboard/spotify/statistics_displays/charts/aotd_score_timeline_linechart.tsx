"use server"

import { CSSProperties } from "react";
import { scaleTime, scaleLinear, max, line as d3_line, curveMonotoneX, timeHour } from "d3";
import { DateTime } from "luxon";
import { Avatar, Divider, Tooltip } from "@heroui/react";
import { getUserAvatarURL } from "@/app/lib/user_utils";
import { Conditional } from "../../../conditional";
import { ratingToTailwindBgColor, ratingToTailwindTextColor } from "@/app/lib/utils";

// Expected Props:
//  - data: List of data formatted for this chart
//  - aotdDate: String aotd date
export async function AOtDScoreTimelineLineChart(props) {
  const timeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone
  // Get data and format through a fast map
  let ratingRange={lowest: 10, highest: 0}
  const data: any = (await Promise.all(props.data.map( async(item) => {
    const adjustedTime = DateTime.fromISO(item.timestamp).setZone(timeZone);
    if(item.value.toFixed(2) < ratingRange.lowest) {
      ratingRange.lowest = item.value.toFixed(2)
    }
    if(item.value.toFixed(2) > ratingRange.highest) {
      ratingRange.highest = item.value.toFixed(2)
    }

    return {
      timestamp: new Date(adjustedTime.toMillis()),
      value: item.value.toFixed(2), // The average value of the album by this timestamp
      user_id: item.user_id,
      user_nickname: item.user_nickname,
      user_discord_id: item.user_discord_id,
      user_avatar_url: await getUserAvatarURL(item.user_discord_id),
      type: item.type,
      score: item.score.toFixed(2), // The score given for this object
      review_id: item.review_id
    }
  }))).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  const aotdDate = `${props.aotdDate.split("-")[1]}/${props.aotdDate.split("-")[2]}/${props.aotdDate.split("-")[0]}`
  // Calculate domain of time
  const startDomain = new Date(data[0].timestamp).setMinutes(-60, 0, 0);
  const endDomain = new Date(data[data.length - 1].timestamp).setMinutes(120, 0, 0);

  let xScale = scaleTime()
    .domain([startDomain, endDomain])
    .range([0, 100]);
  let yScale = scaleLinear()
    .domain([0, 10])
    .range([100, 0]);

  let line = d3_line<(typeof data)[number]>()
    .x((d) => xScale(d.timestamp))
    .y((d) => yScale(d.value));

  let d = line(data);

  // X Axis labeling logic stuff
  const hourlyInterval = timeHour.every(1);
  const ticks = hourlyInterval ? xScale.ticks(hourlyInterval) : [];

  if (!d) {
    return null;
  }

  return (
    <div>
      <Conditional showWhen={new Date(aotdDate) <= new Date("04/08/2025")}>
        <div className="w-full text-center font-extralight mx-auto px-2 py-2 my-2 text-small italic border border-neutral-800 rounded-2xl bg-zinc-800/30 -mt-3 mb-5">
          <p>
            <span className="text-yellow-600"><b>WARNING:</b></span> Score data for albums on or before January 6th 2025 may have incorrect graphs or data.
          </p>
        </div>
      </Conditional>
      <div
        className="relative h-72 w-full"
        style={
          {
            "--marginTop": "0px",
            "--marginRight": "8px",
            "--marginBottom": "25px",
            "--marginLeft": "25px",
          } as CSSProperties
        }
      >
        {/* Y axis */}
        <div
          className="absolute inset-0
            h-[calc(100%-var(--marginTop)-var(--marginBottom))]
            w-[var(--marginLeft)]
            translate-y-[var(--marginTop)]
            overflow-visible
          "
        >
          {yScale
            .ticks(8)
            .map(yScale.tickFormat(8, "d"))
            .map((value, i) => (
              <div
                key={i}
                style={{
                  top: `${yScale(+value)}%`,
                  left: "0%",
                }}
                className="absolute text-xs tabular-nums -translate-y-1/2 text-gray-500 w-full text-right pr-2"
              >
                {value}
              </div>
            ))}
        </div>

        {/* Chart area */}
        <div
          className="absolute inset-0
            h-[calc(100%-var(--marginTop)-var(--marginBottom))]
            w-[calc(100%-var(--marginLeft)-var(--marginRight))]
            translate-x-[var(--marginLeft)]
            translate-y-[var(--marginTop)]
            overflow-visible
          "
        >
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full overflow-visible"
            preserveAspectRatio="none"
          >
            {/* Grid lines */}
            {yScale
              .ticks(8)
              .map(yScale.tickFormat(8, "d"))
              .map((active, i) => (
                <g
                  transform={`translate(0,${yScale(+active)})`}
                  className="text-zinc-300 dark:text-zinc-700"
                  key={i}
                >
                  <line
                    x1={0}
                    x2={100}
                    stroke="currentColor"
                    strokeDasharray="6,5"
                    strokeWidth={0.5}
                    vectorEffect="non-scaling-stroke"
                  />
                </g>
              ))}

            {/* Line */}
            <path
              d={d}
              fill="none"
              stroke="url(#lineFull-gradient)"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
            <defs>
              <linearGradient id="lineFull-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="currentColor" className={`${ratingToTailwindTextColor(ratingRange.highest)}`} />
                <stop offset="100%" stopColor="currentColor" className={`${ratingToTailwindTextColor(ratingRange.lowest)}`} />
              </linearGradient>
            </defs>
          </svg>

          {/* User Icons and Tooltips */}
          {data.map((entry, index) => (
            <Tooltip 
              showArrow={true}
              key={index}
              content={
                <div>
                  <div className="flex flex-row">
                    <p className="text-lg">{entry.user_nickname}</p>
                    <Conditional showWhen={entry.type=="Review"}>
                      <p
                        className="text-xs my-auto border border-green-500 rounded-full px-1 ml-2 bg-green-500/80 italic text-black font-normal"
                      >
                        <b>Final Review</b>
                      </p>
                    </Conditional>
                    <Conditional showWhen={entry.type=="First Update"}>
                    <p
                        className="text-xs my-auto border border-orange-500 rounded-full px-1 ml-2 bg-orange-500/80 italic text-black font-normal"
                      >
                        <b>Inital Review</b>
                      </p>
                    </Conditional>
                  </div>
                  <Divider className="mb-2" />
                  <div className="flex flex-row w-full justify-between mb-1">
                    <p className="my-auto">User Score:</p>
                    <p className={`ml-2 px-2 py-0 ${ratingToTailwindBgColor(entry.score)} rounded-2xl text-black`}><b>{entry.score}</b></p>
                  </div>
                  <div className="flex flex-row w-full justify-between">
                    <p>Album Avg:</p>
                    <p className={`ml-2 px-2 py-0 ${ratingToTailwindBgColor(entry.value)} rounded-2xl text-black`}><b>{entry.value}</b></p>
                  </div>
                  <p className="text-sm italic text-gray-500" >{entry.timestamp.toLocaleTimeString("en-us")}</p>
                </div>
              }
            >
              <div
                style={{
                  top: `${yScale(entry.value)}%`,
                  left: `${xScale(entry.timestamp)}%`,
                  transform: "translate(-50%, -50%)",
                }}
                className="absolute rounded-full overflow-hidden size-6 sm:size-10 cursor-pointer"
              >
                <a
                  href={`/dashboard/spotify/review/${entry.review_id}`}
                >
                  <Avatar
                    src={entry.user_avatar_url}
                    className="size-6 sm:size-10"
                  />
                </a>
              </div>
            </Tooltip>
          ))}
          
          <div className="translate-y-2">
            {/* X Axis */}
            {ticks.map((tick, i) => {
              return (
                <div key={i} className="overflow-visible text-zinc-500">
                  <div
                    style={{
                      left: `${xScale(tick)}%`,
                      top: "100%",
                      transform: `translateX(-50%)`,
                    }}
                    className={`${((i != 0) && (i != ticks.length/2) && (i != ticks.length - 1)) ? "invisible sm:visible" : ""} text-xs absolute text-nowrap`}
                  >
                    {tick.toLocaleTimeString("en-US", {
                      timeZone: "America/Chicago",
                      hour: "numeric",
                      hour12: true,
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <p className="text-sm text-gray-500 ml-2 italic">Times are shown in {timeZone}</p>
      <p className="text-sm text-gray-500 ml-2 italic">Review updates that did not alter score are not shown in the chart.</p>
    </div>
  );
}