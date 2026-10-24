@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul || (echo Node.js পাওয়া যায়নি. https://nodejs.org থেকে LTS ভার্সন ইনস্টল করুন, তারপর আবার চালান. & pause & exit /b 1)
start "" http://localhost:3000/login.html
node --no-warnings --experimental-sqlite server\server.js
pause
