
export const getFilesInDir = (dir: string) => {
  const fs = require('fs');
  const out: string[] =[]
  // Debug Log
  console.log("Attempting to read files in: " + dir);

  fs.readdirSync(dir, { withFileTypes: true }).forEach((file: string | { name: string, path: string}) => {
    out.push(file.name); 
  });
  // Debug Log
  console.log(out);

  // Return
  return out;
};