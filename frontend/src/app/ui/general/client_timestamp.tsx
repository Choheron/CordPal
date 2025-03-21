'use client'

import { generateDateFromUTCString, zeroPad, formatDateString } from "@/app/lib/utils";

// Display a time in user timezone
// Expected Props:
//  - timestamp: String - UTC Timestamp
//  - className: String - classname to pass to p block
//  - full: Boolean - return full timestamp or shortened one
//  - maintainUTC: Boolean - Dont convert to local timestamp (Default False)
export default function ClientTimestamp(props) {
  const full = (props.full) ? props.full : false;
  var utcDate = new Date()
  try {
    utcDate = generateDateFromUTCString(props.timestamp)
  } catch {
    utcDate = generateDateFromUTCString(formatDateString(props.timestamp))
  }
  const adjustedTimestamp = (props.maintainUTC == true) ? convertToLocalTZString(utcDate, "Etc/UTC") : convertToLocalTZString(utcDate);
  
  // Convert passed in date object to local timezone
  function convertToLocalTZString(date, timezoneOverride: string = "") {
    // Use client to get proper times
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    // Convert timezone
    const adjustedDate = new Date((typeof date === "string" ? new Date(date) : date).toLocaleString("en-US", {timeZone: ((timezoneOverride != "") ? timezoneOverride : timezone)}));
    // Get in String
    const adjDateString = adjustedDate.toString();
    // Trim down string as needed
    let splitString = adjDateString.split(" ")
    // Delete not required string elements
    splitString = splitString.slice(1, 4+1)
    // Convert to 12 hour
    const suffix = (adjustedDate.getHours() >= 12)? "PM": "AM"
    //only -12 from hours if it is greater than 12 (if not back at mid night)
    let hours = (adjustedDate.getHours() > 12)? adjustedDate.getHours() - 12 : adjustedDate.getHours();
    //if 00 then it is 12 am
    hours = (hours == 0)? 12 : hours;
    return `${splitString[0]} ${zeroPad(splitString[1],2)} ${zeroPad(splitString[2],2)}` + ((full) ? ` ${zeroPad(hours,2)}:${zeroPad(adjustedDate.getMinutes(),2)}:${zeroPad(adjustedDate.getSeconds(),2)} ${suffix}` : "")
  }

  return (
    <p className={props.className}>{adjustedTimestamp}</p>
  );
}