// Convert boolean value to string
export const boolToString = (input: boolean) => {
  return String(input).toUpperCase();
};

// Convert boolean value to emoji
export const boolToEmoji = (input: boolean) => {
  const bool = String(input).toUpperCase();
  return ((bool == "TRUE") ? "<p>&#x2705;</p>" : "<p>&#x274C;</p>")
};

// Capitalize first letter in string
export function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Pad a number with leading zeros
export const zeroPad = (num, places) => String(num).padStart(places, '0')

// Generate a date object from a UTC string in the following format
// 12/19/2024, 15:07:22
export function generateDateFromUTCString(utcString) {
  const splitList = utcString.split(",")
  const dateList = splitList[0].split("/")
  const timeList = splitList[1].split(":")

  return new Date(Date.UTC(dateList[2], parseInt(dateList[0]) - 1, dateList[1], timeList[0], timeList[1], timeList[2]))
}

// Generate a date from a XXXTXXXZ String
// 2024-10-17T17:24:32.191Z
export function formatDateString(string) {
  const splitList = string.split("T")
  const dateList = splitList[0].split("-")
  const timeList = splitList[1].slice(0, -1).split(":")

  return `${dateList[1]}/${dateList[2]}/${dateList[0]}, ${timeList[0]}:${timeList[1]}:${timeList[2]}`
}

// Convert passed in date object to local timezone
export function convertToLocalTZString(date: Date, full: boolean = false) {
  // Use client to get proper times
  "use client"
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  // Convert timezone
  const adjustedDate = new Date((typeof date === "string" ? new Date(date) : date).toLocaleString("en-US", {timeZone: timezone}));
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
  return `${splitString[0]} ${splitString[1]} ${splitString[2]}` + ((full) ? ` ${hours}:${padNumber(adjustedDate.getMinutes())}:${padNumber(adjustedDate.getSeconds())} ${suffix}` : "")
}

// Convert a rating to a string representing tailwind color
export function ratingToTailwindBgColor(rating: number) {
  // Normalize rating
  rating = Math.max(0.0, rating);
  rating = Math.min(10.00, rating);
  if(rating >= 9.99)
    return "bg-[#55ff00]"
  if(rating >= 9.0)
    return "bg-[#83ee00]"
  if(rating >= 8.0)
    return "bg-[#a4db00]"
  if(rating >= 7.0)
    return "bg-[#bac800]"
  if(rating >= 6.0)
    return "bg-[#cdb400]"
  if(rating >= 5.0)
    return "bg-[#dc9e00]"
  if(rating >= 4.0)
    return "bg-[#ea8600]"
  if(rating >= 3.0)
    return "bg-[#f66900]"
  if(rating >= 2.0)
    return "bg-[#fc4700]"
  if(rating >= 1.0)
    return "bg-[#de1111]"
  if(rating >= 0.0)
    return "bg-[#ff0000]"
}

// Convert a rating to a string representing tailwind color
export function ratingToTailwindTextColor(rating: number) {
  // Normalize rating
  rating = Math.max(0.0, rating);
  rating = Math.min(10.00, rating);
  if(rating >= 9.99)
    return "text-[#55ff00]"
  if(rating >= 9.0)
    return "text-[#83ee00]"
  if(rating >= 8.0)
    return "text-[#a4db00]"
  if(rating >= 7.0)
    return "text-[#bac800]"
  if(rating >= 6.0)
    return "text-[#cdb400]"
  if(rating >= 5.0)
    return "text-[#dc9e00]"
  if(rating >= 4.0)
    return "text-[#ea8600]"
  if(rating >= 3.0)
    return "text-[#f66900]"
  if(rating >= 2.0)
    return "text-[#fc4700]"
  if(rating >= 1.0)
    return "text-[#de1111]"
  if(rating >= 0.0)
    return "text-[#ff0000]"
}

// Return true if it is currently in December
export const isDecember = () => {
  // Get Current Date
  const today = new Date();
  // Get month (0 indexed return)
  let month = today.getMonth(); 

  // Return equality operation
  return month == 11;
};

// Get day before passed in date
export function getPrevDay(day: Date) {
  let dateObj = new Date(day);
  dateObj.setDate(dateObj.getDate());
  return dateObj
}

// Get day before passed in date
export function getNextDay(day: Date) {
  let dateObj = new Date(day);
  dateObj.setDate(dateObj.getDate() + 2);
  return dateObj
}

// Convert date to yyyy-mm-dd format
export function dateToYYYYMMDD(day: Date) {
  return day.toISOString().split('T')[0];
}

// Convert online status to a background color
export function onlineStatusToTailwindBgColor(status: string) {
  switch(status.toUpperCase()) {
    case "OFFLINE":
      return "bg-red-700";
    case "AWAY": 
      return "bg-orange-700";
    case "ONLINE":
      return "bg-green-600";
  }
}

// Pad number if needed
export function padNumber(number) {
  return number.toString().padStart(2, "0")
}

// Turn a month number into a month name (month numbers are in calendar format)
export function monthToName(monthNum) {
  const months = [ "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December" ];
  
  return months[monthNum - 1];
}

// Get number of days in a month
export function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

// Convert date string in YYYY-MM-DD format to a human readable string
export function dateToString(dateStr: string) {
  const dateArr = dateStr.split("-")

  return `${monthToName(dateArr[1])} ${dateArr[2]}, ${dateArr[0]}`
}