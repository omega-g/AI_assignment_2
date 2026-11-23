@echo off
echo ========================================================
echo Starting Connect 4 AI Studio (Backend + Frontend)
echo ========================================================

start "Connect 4 AI - Backend (Port 8000)" cmd /k "run_backend.bat"
start "Connect 4 AI - Frontend (Port 3000)" cmd /k "run_frontend.bat"

echo.
echo Both servers launched in separate windows!
echo Backend:  http://127.0.0.1:8000 (Docs: http://127.0.0.1:8000/docs)
echo Frontend: http://localhost:3000
echo.
