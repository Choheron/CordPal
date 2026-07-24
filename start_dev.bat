@ECHO OFF

cd /d B:\CODE\Repos\discord-website

wt ^
  new-tab -d "B:\CODE\Repos\discord-website\backend" --title "Backend Dev" powershell -NoExit -ExecutionPolicy Bypass -File "B:\CODE\Repos\discord-website\run_dev.ps1" ^; ^
  new-tab -d "B:\CODE\Repos\discord-website\frontend" --title "Frontend Dev" cmd /k "npm run dev" ^; ^
  new-tab -d "B:\CODE\Repos\discord-website\backend" --title "Backend Docker" ^; ^
  new-tab -d "B:\CODE\Repos\discord-website\frontend" --title "Frontend Docker"

ECHO All tabs opened successfully.
PAUSE
