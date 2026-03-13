@ECHO OFF

cd /d E:\CODE\Repos\discord-website

wt ^
  new-tab -d "E:\CODE\Repos\discord-website\frontend" --title "Frontend Docker" ^; ^
  new-tab -d "E:\CODE\Repos\discord-website\backend" --title "Backend Docker" ^; ^
  new-tab -d "E:\CODE\Repos\discord-website\frontend" --title "Frontend Dev" cmd /k "npm run dev" ^; ^
  new-tab -d "E:\CODE\Repos\discord-website\backend" --title "Backend Dev" powershell -NoExit -ExecutionPolicy Bypass -File ".\run_dev.ps1"

ECHO All tabs opened successfully.
PAUSE
