@echo off
title Malachia - bibliotheca privata
cd /d "%~dp0"

echo.
echo   ============================================
echo      M A L A C H I A  -  bibliotheca privata
echo   ============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo   [ERRORE] Node.js non trovato. Scaricalo da https://nodejs.org
  echo.
  pause
  exit /b 1
)

if not exist "node_modules"          ( echo   [INFO] Installo dipendenze...          & call npm install --no-audit --no-fund )
if not exist "backend\node_modules"  ( echo   [INFO] Installo dipendenze backend...  & call npm --prefix backend install --no-audit --no-fund )
if not exist "frontend\node_modules" ( echo   [INFO] Installo dipendenze frontend... & call npm --prefix frontend install --no-audit --no-fund )

echo   Avvio in corso...
echo     backend   http://localhost:3001
echo     frontend  http://localhost:5173
echo.
echo   Il browser si aprira' tra pochi secondi.
echo   Per fermare Malachia chiudi questa finestra (o premi Ctrl+C).
echo.

start "" /b cmd /c "timeout /t 5 >nul & start http://localhost:5173"
call npm start
