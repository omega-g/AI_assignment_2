@echo off
echo ========================================================
echo Running Connect 4 AI Backend Automated Test Suite
echo ========================================================
set PYTHONHOME=C:\Users\Sigma - PC\AppData\Local\Programs\Python\Python314
set PYTHONPATH=backend
"C:\Python314\python.exe" -m unittest discover -s backend/app/tests -v
pause
