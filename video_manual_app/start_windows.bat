@echo off
setlocal enabledelayedexpansion

echo ====================================================
echo   Video to Manual App - Setup and Launch
echo ====================================================
echo.

rem --- Check Python ---------------------------------------------------
set PYOK=0
python --version >"%TEMP%\pyver_check.txt" 2>&1
findstr /i "Python" "%TEMP%\pyver_check.txt" >nul
if not errorlevel 1 set PYOK=1

if "%PYOK%"=="0" (
    echo [MISSING] Python was not found.
    echo Please install Python 3.12 from the link below.
    echo IMPORTANT: check "Add python.exe to PATH" during setup.
    echo Also avoid the very newest version ^(e.g. 3.14^) - some
    echo required libraries do not support it yet. Use 3.12.x.
    echo.
    echo   https://www.python.org/downloads/release/python-3120/
    echo.
    echo After installing, double-click this file again.
    pause
    exit /b 1
)

for /f "tokens=2" %%v in ('type "%TEMP%\pyver_check.txt"') do set PYVER=%%v
del "%TEMP%\pyver_check.txt" >nul 2>nul
echo Found Python %PYVER%
echo %PYVER% | findstr /b "3.14" >nul
if not errorlevel 1 (
    echo [WARNING] Python 3.14 is very new and some libraries this app
    echo needs may not support it yet. If setup fails below, please
    echo install Python 3.12 instead from:
    echo   https://www.python.org/downloads/release/python-3120/
    echo.
)

rem --- Check ffmpeg -----------------------------------------------------
where ffmpeg >nul 2>nul
if errorlevel 1 (
    echo [MISSING] ffmpeg was not found ^(required to split videos^).
    echo Install it one of these ways:
    echo   A: run this command in a terminal:  winget install Gyan.FFmpeg
    echo   B: download from https://www.gyan.dev/ffmpeg/builds/
    echo      and add its "bin" folder to your PATH
    echo.
    echo After installing, double-click this file again.
    pause
    exit /b 1
)

rem --- Check tesseract (optional) ---------------------------------------
where tesseract >nul 2>nul
if errorlevel 1 (
    echo [OPTIONAL] Tesseract OCR was not found. The app will still run,
    echo but on-screen text will not be extracted from the video frames.
    echo To enable that, install it ^(check "Japanese" during setup^):
    echo   https://github.com/UB-Mannheim/tesseract/wiki
    echo.
)

rem --- Install Python packages -------------------------------------------
echo Installing required packages, this can take a minute the first time...
python -m pip install --quiet --disable-pip-version-check --upgrade pip
python -m pip install --quiet --disable-pip-version-check -r "%~dp0requirements.txt"

python -c "import streamlit" >nul 2>nul
if errorlevel 1 (
    echo.
    echo [ERROR] Package installation did not complete successfully
    echo ^(streamlit could not be imported^).
    echo This is often caused by using a too-new Python version.
    echo Please install Python 3.12 from the link below, then run this
    echo file again:
    echo   https://www.python.org/downloads/release/python-3120/
    pause
    exit /b 1
)

echo.
echo Starting the app. Your browser should open automatically...
echo ^(to stop the app later, just close this black window^)
python -m streamlit run "%~dp0app.py"

pause
