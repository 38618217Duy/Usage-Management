@echo off
REM ============================================================
REM Script đồng bộ email accounts từ Cursor dashboard
REM Có thể thêm vào Windows Task Scheduler để chạy định kỳ
REM ============================================================

cd /d "%~dp0.."
echo Running Account Email Sync...
echo.

node scripts/sync-accounts.js %*

echo.
echo Sync completed at %date% %time%
pause
