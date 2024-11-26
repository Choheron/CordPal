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
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  // Convert timezone
  const adjustedDate = new Date((typeof date === "string" ? new Date(date) : date).toLocaleString("en-US", {timeZone: timezone}));
  // Get in String
  const adjDateString = adjustedDate.toString();
  // Trim down string as needed
  let splitString = adjDateString.split(" ")
  // Delete not required string elements
  splitString = splitString.slice(1, 4+1)
  return `${splitString[0]} ${splitString[1]} ${splitString[2]}` + ((full) ? ` ${splitString[3]}` : "")
}