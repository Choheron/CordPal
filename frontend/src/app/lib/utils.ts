// Convert boolean value to string
export const boolToString = (input: boolean) => {
  return String(input).toUpperCase();
};

// Capitalize first letter in string
export function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
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
  console.log(adjDateString)
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