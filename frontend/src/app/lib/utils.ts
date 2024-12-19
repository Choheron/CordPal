// Convert boolean value to string
export const boolToString = (input: boolean) => {
  return String(input).toUpperCase();
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
  return `${splitString[0]} ${splitString[1]} ${splitString[2]}` + ((full) ? ` ${hours}:${adjustedDate.getMinutes()}:${adjustedDate.getSeconds()} ${suffix}` : "")
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

// Return true if it is currently in December
export const isDecember = () => {
  // Get Current Date
  const today = new Date();
  // Get month (0 indexed return)
  let month = today.getMonth(); 

  // Return equality operation
  return month == 11;
};