@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

set PORT=8080
set URL=http://localhost:%PORT%/

echo ============================================
echo   Bible Adventures - local dev server
echo ============================================
echo.
echo   Serving:  %CD%
echo   URL:      %URL%
echo.
echo   Leave this window OPEN while you play.
echo   Press Ctrl+C (then Y) to stop.
echo.

rem ---------------------------------------------------------------
rem  Try runtimes in order. "py" is checked FIRST on purpose: on
rem  Windows 10/11 a bare "python" is often an App Execution Alias
rem  that opens the Microsoft Store instead of running Python, and
rem  "python3" usually does not exist at all. The py launcher only
rem  exists when real Python is installed, so it is the safe probe.
rem ---------------------------------------------------------------

py -3 --version >nul 2>&1
if !errorlevel! equ 0 (
  echo   Using: py -3
  echo.
  start "" "%URL%"
  py -3 -m http.server %PORT%
  goto :done
)

rem Reject the Microsoft Store stub, which lives under WindowsApps
set REALPY=
for /f "delims=" %%P in ('where python 2^>nul') do (
  echo %%P | find /i "WindowsApps" >nul || set REALPY=%%P
)
if defined REALPY (
  echo   Using: !REALPY!
  echo.
  start "" "%URL%"
  "!REALPY!" -m http.server %PORT%
  goto :done
)

where node >nul 2>&1
if !errorlevel! equ 0 (
  echo   Using: npx http-server
  echo.
  start "" "%URL%"
  npx --yes http-server -p %PORT% -c-1
  goto :done
)

echo.
echo   ---------------------------------------------------------
echo   No usable Python or Node was found on this machine.
echo.
echo   Install Python:  https://www.python.org/downloads/
echo   IMPORTANT: tick "Add python.exe to PATH" on the first
echo   screen of the installer, then run this file again.
echo   ---------------------------------------------------------
echo.

:done
echo.
echo   Server stopped.
pause
