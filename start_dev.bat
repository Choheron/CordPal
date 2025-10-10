@ECHO OFF

ECHO Navigating to correct directory...
cd E:\CODE\Repos\discord-website

ECHO Opening tabs in Windows Terminal...

REM First tab: Frontend Docker build
wt -w 0 nt -d E:\CODE\Repos\discord-website\frontend --title "Frontend Docker"

REM Second tab: Backend Docker build
wt -w 0 nt -d E:\CODE\Repos\discord-website\backend --title "Backend Docker"

REM Third tab: Frontend development server
wt -w 0 nt -d E:\CODE\Repos\discord-website\frontend --title "Frontend Dev" powershell -noexit -command npm run dev

REM Fourth tab: Backend development server
wt -w 0 nt -d E:\CODE\Repos\discord-website\backend --title "Backend Dev" powershell -noexit -command "./venv/Scripts/activate; python ./manage.py runserver"

ECHO All tabs opened successfully.

PAUSE