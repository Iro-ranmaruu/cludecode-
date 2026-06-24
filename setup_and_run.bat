@echo off
chcp 65001 > nul
echo ================================================
echo  議事録AIサマリー セットアップ
echo ================================================
echo.

REM Pythonの確認
python --version > nul 2>&1
if %errorlevel% neq 0 (
    echo [エラー] Pythonがインストールされていません。
    echo https://www.python.org/downloads/ からインストールしてください。
    echo インストール時に「Add Python to PATH」にチェックを入れてください。
    pause
    exit /b 1
)
echo [OK] Pythonが見つかりました。

REM ライブラリのインストール
echo.
echo ライブラリをインストールしています（少し時間がかかります）...
pip install flask anthropic python-docx pdfplumber python-dotenv > nul 2>&1
if %errorlevel% neq 0 (
    echo [エラー] ライブラリのインストールに失敗しました。
    pause
    exit /b 1
)
echo [OK] ライブラリのインストール完了。

REM APIキーの入力
echo.
echo ================================================
echo  Anthropic APIキーを入力してください。
echo  APIキーは https://console.anthropic.com から取得できます。
echo  （sk-ant- で始まる文字列です）
echo ================================================
set /p API_KEY="APIキーを貼り付けてEnterを押してください: "

if "%API_KEY%"=="" (
    echo [エラー] APIキーが入力されていません。
    pause
    exit /b 1
)

set ANTHROPIC_API_KEY=%API_KEY%

REM アプリの起動
echo.
echo ================================================
echo  アプリを起動しています...
echo  ブラウザで http://localhost:5000 を開いてください
echo  終了するには Ctrl+C を押してください
echo ================================================
echo.
python app.py
pause
