@echo off
REM start-local.bat — inicia servidor API e servidor estático para testes locais
REM Usage: double-click this file or run it from PowerShell/CMD

REM Resolve script directory
SET "ROOT=%~dp0"
echo Starting "O Jogo do Nunca" local environment from %ROOT%

REM Start backend server (Node) in a new window
if exist "%ROOT%server\index.js" (
    echo Starting backend server...
    start "jogo-do-nunca-server" cmd /k "cd /d "%ROOT%server" && if not exist node_modules (echo Installing server dependencies... && npm install) && echo Running server on port 3000 && node index.js"
) else (
    echo No server folder found at "%ROOT%server" — skipping backend startup.
)

REM Start static file server (try python, fallback to npx http-server)
echo Starting static file server (serving %ROOT%) on http://localhost:8000 ...
where python >nul 2>&1
if errorlevel 1 (
    echo Python not found — using npx http-server (requires Node.js)
    start "static-server" cmd /k "cd /d "%ROOT%" && npx http-server -c-1 -p 8000"
) else (
    echo Found Python — using python -m http.server
    start "static-server" cmd /k "cd /d "%ROOT%" && python -m http.server 8000"
)

REM Give the servers a moment then open the default browser
timeout /t 2 >nul
start "" "http://localhost:8000"

echo Done. Two windows were opened for server and static file serving.
echo If you need to stop them, close the opened console windows or use task manager.
pause
