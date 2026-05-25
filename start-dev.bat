@echo off
echo ========================================
echo Starting Dentist Clinic Management System
echo ========================================
echo.

echo Checking if backend is set up...
cd backend

if not exist "node_modules" (
    echo Installing backend dependencies...
    call npm install
)

echo.
echo Starting backend server on port 5001...
start cmd /k "cd /d %CD% && npm start"

timeout /t 3 /nobreak > nul

cd ..
cd frontend

if not exist "node_modules" (
    echo Installing frontend dependencies...
    call npm install
)

echo.
echo Starting frontend server on port 3000...
start cmd /k "cd /d %CD% && npm run dev"

echo.
echo ========================================
echo Servers are starting...
echo Backend: http://localhost:5001
echo Frontend: http://localhost:3000
echo ========================================
echo.
echo Press any key to exit this window...
pause > nul
