"use server"

import { CSSProperties } from "react";
import { scaleTime, scaleLinear, max, line as d3_line, curveMonotoneX } from "d3";
import UserAvatar from "@/app/ui/general/userUiItems/user_avatar";
import { DateTime } from "luxon";
import { ClientTooltip, TooltipContent, TooltipTrigger } from "../../../../general/charts/rosen_tooltip"; 

// Expected Props:
//  - data: List of data formatted for this chart
//  - aotdDate: String aotd date
export async function AOtDScoreTimelineLineChart(props) {
  const timeZone = 'America/Chicago';

  const data: any = props.data.map((item, i) => {
    const adjustedTime = DateTime.fromISO(item.timestamp).setZone("America/Chicago");

    return {
      timestamp: new Date(adjustedTime.toMillis()),
      value: item.value,
      user_id: item.user_id,
      user_nickname: item.user_nickname,
      user_discord_id: item.user_discord_id
    }
  })
  const aotdDate = `${props.aotdDate.split("-")[1]}/${props.aotdDate.split("-")[2]}/${props.aotdDate.split("-")[0]}`
  // Get start and end of day for scaling
  const startOfDay = new Date(
    new Intl.DateTimeFormat('en-US', {
      timeZone: timeZone,
    }).format(new Date(aotdDate))
  );
  const endOfDay = new Date(new Date(startOfDay).setHours(23, 59, 59, 999));


  let xScale = scaleTime()
    .domain([startOfDay, endOfDay])
    .range([0, 100]);
  let yScale = scaleLinear()
    .domain([0, 10])
    .range([100, 0]);

  let line = d3_line<(typeof data)[number]>()
    .x((d) => xScale(d.timestamp))
    .y((d) => yScale(d.value))
    .curve(curveMonotoneX);

  let d = line(data);

  if (!d) {
    return null;
  }

  return (
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
            className="stroke-gray-400"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        
        <div className="translate-y-2">
          {/* X Axis */}
          {xScale.ticks(24).map((tick, i) => {
            return (
              <div key={i} className="overflow-visible text-zinc-500">
                <div
                  style={{
                    left: `${xScale(tick)}%`,
                    top: "100%",
                    transform: `translateX(${i === 0 ? "0%" : i === data.length - 1 ? "-100%" : "-50%"})`, // The first and last labels should be within the chart area
                  }}
                  className="text-xs absolute"
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
      {/* Labels */}
      <div
        className="
        h-[calc(100%-var(--marginTop)-var(--marginBottom))]
        w-[calc(100%-var(--marginLeft)-var(--marginRight))]
        translate-x-[var(--marginLeft)]
        translate-y-[var(--marginTop)]
      "
      >
        {data.map((entry, i) => (
          <div
            key={i}
            style={{
              top: `${yScale(entry.value)}%`,
              left: `${xScale(entry.timestamp)}%`,
              transform: "translate(-50%, -50%)",
            }}
            className="absolute rounded-full overflow-hidden size-10 text-gray-700 pointer-events-none"
          >
            <UserAvatar 
              userDiscordID={entry['user_discord_id']}
            />
          </div>
        ))}
      </div>
    </div>
  );
}