export const getFilesInDir = (dir: string) => {
  const fs = require('fs');
  const out: string[] =[]
  // Debug Log
  console.log("Attempting to read files in: " + dir);

  fs.readdirSync(dir, { withFileTypes: true }).forEach((file: { name: string, path: string}) => {
    out.push(file.name); 
  });

  console.log("Image files successfully read...")
  // Return
  return out;
};

// Convert boolean value to string
export const boolToString = (input: boolean) => {
  return String(input);
};

// Capitalize first letter in string
export function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}