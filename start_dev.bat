@ECHO OFF

ECHO Navigating to correct directory...
cd E:\CODE\Repos\discord-website

ECHO Opening tabs in Windows Terminal...

wt ^
  new-tab -d "E:\CODE\Repos\discord-website\frontend" --title "Frontend Docker" ^; ^
  new-tab -d "E:\CODE\Repos\discord-website\backend" --title "Backend Docker" ^; ^
  new-tab -d "E:\CODE\Repos\discord-website\frontend" --title "Frontend Dev" powershell -NoExit -Command "npm run dev" ^; ^
  new-tab -d "E:\CODE\Repos\discord-website\backend" --title "Backend Dev" powershell -NoExit -Command "Set-ExecutionPolicy -Scope Process Bypass; .\venv\Scripts\Activate.ps1; python manage.py runserver"

ECHO All tabs opened successfully.
PAUSE
