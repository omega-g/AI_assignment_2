@echo off
echo ========================================================
echo Starting Connect 4 AI FastAPI Backend Server
echo ========================================================
set PYTHONHOME=C:\Users\Sigma - PC\AppData\Local\Programs\Python\Python314
set PYTHONPATH=backend
"C:\Python314\python.exe" -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
pause
