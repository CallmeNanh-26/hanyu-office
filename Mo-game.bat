@echo off
chcp 65001 >nul
rem Bấm đúp để mở game tại http://localhost:5173/prototype/ . Giữ cửa sổ đen này mở trong lúc học.
cd /d "%~dp0"
start "" cmd /c "timeout /t 2 >nul & start http://localhost:5173/prototype/"
node tools\serve.js
pause
