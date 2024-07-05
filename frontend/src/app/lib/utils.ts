export const getFilesInDir = (dir: string) => {
  const fs = require('fs');
  const out: string[] =[]
  // Debug Log
  console.log("Attempting to read files in: " + dir);

  fs.readdirSync(dir, { withFileTypes: true }).forEach((file: { name: string, path: string}) => {
    out.push(file.name); 
  });
  // Debug Log
  console.log(out);

  // Return
  return out;
};

// Convert boolean value to string
export const boolToString = (input: boolean) => {
  return String(input);
};
