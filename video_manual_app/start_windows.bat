@echo off
setlocal

echo ============================================
echo   動画マニュアル自動生成アプリ
echo ============================================
echo.

set PYOK=0
python --version >"%TEMP%\pyver_check.txt" 2>&1
findstr /i "Python" "%TEMP%\pyver_check.txt" >nul
if not errorlevel 1 set PYOK=1
del "%TEMP%\pyver_check.txt" >nul 2>nul

if "%PYOK%"=="0" (
    echo [必要] Python が見つかりません。
    echo 下記からインストールしてください。
    echo インストール画面の一番下「Add python.exe to PATH」に必ずチェックを入れてください。
    echo.
    echo   https://www.python.org/downloads/windows/
    echo.
    echo インストールが終わったら、もう一度このファイルをダブルクリックしてください。
    pause
    exit /b 1
)

where ffmpeg >nul 2>nul
if errorlevel 1 (
    echo [必要] ffmpeg が見つかりません（動画の分割に必須です）。
    echo 下記のどちらかの方法でインストールしてください。
    echo.
    echo  方法A: このウィンドウで次のコマンドを実行  winget install Gyan.FFmpeg
    echo  方法B: https://www.gyan.dev/ffmpeg/builds/ からダウンロードし、
    echo         中の bin フォルダを PATH に追加する
    echo.
    echo インストールが終わったら、もう一度このファイルをダブルクリックしてください。
    pause
    exit /b 1
)

where tesseract >nul 2>nul
if errorlevel 1 (
    echo [任意] Tesseract OCR が見つからないため、文字読み取りなしで動作します。
    echo 画面内の文字も読み取りたい場合は、下記からインストールしてください
    echo （インストール画面で Japanese にチェックを入れてください）。
    echo   https://github.com/UB-Mannheim/tesseract/wiki
    echo.
)

echo 必要な部品を準備しています（初回のみ少し時間がかかります）...
python -m pip install --quiet --disable-pip-version-check -r "%~dp0requirements.txt"
if errorlevel 1 (
    echo [エラー] 準備に失敗しました。インターネット接続を確認してください。
    pause
    exit /b 1
)

echo.
echo アプリを起動します。自動的にブラウザが開きます...
echo （閉じたいときはこの黒いウィンドウを閉じてください）
python -m streamlit run "%~dp0app.py"

pause
