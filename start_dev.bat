@ECHO OFF

cd /d E:\CODE\Repos\discord-website

wt ^
  new-tab -d "E:\CODE\Repos\discord-website\frontend" --title "Frontend Docker" ^; ^
  new-tab -d "E:\CODE\Repos\discord-website\backend" --title "Backend Docker" ^; ^
  new-tab -d "E:\CODE\Repos\discord-website\frontend" --title "Frontend Dev" cmd /k "npm run dev" ^; ^
  new-tab -d "E:\CODE\Repos\discord-website\backend" --title "Backend Dev" powershell -NoExit -ExecutionPolicy Bypass -Command ".\venv\Scripts\Activate.ps1; python manage.py runserver"

ECHO All tabs opened successfully.
PAUSE
