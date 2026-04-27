@echo off
setlocal EnableExtensions EnableDelayedExpansion

REM Lance backend + frontend pour le projet dev-web-ing1
REM Usage: double-cliquer ce fichier ou l'executer dans un terminal.

cd /d "%~dp0"

echo ==================================================
echo  Dev-Web ING1 - Lancement complet
echo ==================================================

REM Charger les variables depuis .env (si present)
if exist ".env" (
  for /f "usebackq tokens=1* delims==" %%A in (".env") do (
    set "K=%%A"
    set "V=%%B"
    if defined K (
      if not "!K:~0,1!"=="#" (
        set "!K!=!V!"
      )
    )
  )
  echo [OK] Variables .env chargees
) else (
  echo [INFO] Aucun .env detecte (lancement avec config par defaut)
)

where mvn >nul 2>&1
if errorlevel 1 (
  echo [ERREUR] Maven introuvable dans PATH. Installe Maven ou ouvre un terminal configure.
  pause
  exit /b 1
)

where npm.cmd >nul 2>&1
if errorlevel 1 (
  echo [ERREUR] npm introuvable. Installe Node.js.
  pause
  exit /b 1
)

if not exist "frontend\package.json" (
  echo [ERREUR] Dossier frontend invalide: "%~dp0frontend"
  pause
  exit /b 1
)

echo [1/2] Lancement Backend (Spring Boot)...
start "DevWeb Backend" cmd /k "cd /d \"%~dp0\" && mvn spring-boot:run"

echo [2/2] Lancement Frontend (Vite)...
start "DevWeb Frontend" cmd /k "cd /d \"%~dp0frontend\" && npm.cmd run dev"

echo.
echo Attends 5-10 secondes puis ouvre:
echo  - Frontend: http://localhost:5173
echo  - Health API: http://localhost:8080/api/health
echo.

start "" "http://localhost:5173"

exit /b 0
