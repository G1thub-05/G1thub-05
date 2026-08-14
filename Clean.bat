@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion
title Windows Cleaner Pro
color 0B

cls

REM =========================================================
REM INITIAL STATUS
REM =========================================================

set "TEMP_STATUS=FAILED"
set "WINDOWS_TEMP_STATUS=FAILED"
set "WER_STATUS=FAILED"
set "THUMBNAIL_STATUS=FAILED"
set "RECYCLE_STATUS=FAILED"
set "DNS_STATUS=FAILED"


REM =========================================================
REM HEADER
REM =========================================================

echo.
echo  ╔══════════════════════════════════════════════════════════════════════════════╗
echo  ║                          System Junk Cleanup Utility                         ║
echo  ╚══════════════════════════════════════════════════════════════════════════════╝
echo.

timeout /t 1 /nobreak >nul


REM =========================================================
REM 1. USER TEMP
REM =========================================================

color 0B
echo  [1/6]  USER TEMP: %TEMP%
echo.

del /s /f /q "%TEMP%\*" >nul 2>&1

if not errorlevel 1 (
    color 0A
    echo         [OK] User TEMP cleaned.
    set "TEMP_STATUS=CLEANED [OK]"
) else (
    color 0C
    echo         [!] User TEMP could not be completely cleaned.
    set "TEMP_STATUS=FAILED [!]"
)

echo.
color 0B


REM =========================================================
REM 2. WINDOWS TEMP
REM =========================================================

echo  [2/6]  WINDOWS TEMP: C:\Windows\Temp
echo.

del /s /f /q "C:\Windows\Temp\*" >nul 2>&1

if not errorlevel 1 (
    color 0A
    echo         [OK] Windows TEMP cleaned.
    set "WINDOWS_TEMP_STATUS=CLEANED [OK]"
) else (
    color 0C
    echo         [!] Windows TEMP could not be completely cleaned.
    set "WINDOWS_TEMP_STATUS=FAILED [!]"
)

echo.
color 0B


REM =========================================================
REM 3. WINDOWS ERROR REPORTS
REM =========================================================

echo  [3/6]  WINDOWS ERROR REPORTS: C:\ProgramData\Microsoft\Windows\WER
echo.

del /s /f /q "C:\ProgramData\Microsoft\Windows\WER\*" >nul 2>&1

if not errorlevel 1 (
    color 0A
    echo         [OK] Error Reports cleaned.
    set "WER_STATUS=CLEANED [OK]"
) else (
    color 0C
    echo         [!] Error Reports could not be completely cleaned.
    set "WER_STATUS=FAILED [!]"
)

echo.
color 0B


REM =========================================================
REM 4. THUMBNAIL CACHE
REM =========================================================

echo  [4/6]  THUMBNAIL CACHE: Explorer thumbnail database
echo.

del /f /q "%LocalAppData%\Microsoft\Windows\Explorer\thumbcache_*.db" >nul 2>&1

if not errorlevel 1 (
    color 0A
    echo         [OK] Thumbnail Cache cleaned.
    set "THUMBNAIL_STATUS=CLEANED [OK]"
) else (
    color 0C
    echo         [!] Thumbnail Cache could not be completely cleaned.
    set "THUMBNAIL_STATUS=FAILED [!]"
)

echo.
color 0B

REM =========================================================
REM 5. RECYCLE BIN
REM =========================================================

echo  [5/6]  RECYCLE BIN: Emptying deleted files...
echo.

powershell -NoProfile -Command ^
"$ErrorActionPreference='Stop'; ^
try { ^
    Clear-RecycleBin -DriveLetter C -Force -ErrorAction Stop; ^
    exit 0 ^
} catch { ^
    Write-Host $_.Exception.Message; ^
    exit 1 ^
}"

if not errorlevel 1 (
    color 0A
    echo         [OK] Recycle Bin emptied.
    set "RECYCLE_STATUS=EMPTIED [OK]"
) else (
    color 0C
    echo         [!] Recycle Bin cleanup failed.
    set "RECYCLE_STATUS=FAILED [!]"
)

echo.
color 0B


REM =========================================================
REM 6. DNS CACHE
REM =========================================================

echo  [6/6]  DNS CACHE: Flushing DNS resolver cache...
echo.

ipconfig /flushdns >nul 2>&1

if not errorlevel 1 (
    color 0A
    echo         [OK] DNS Cache flushed.
    set "DNS_STATUS=FLUSHED [OK]"
) else (
    color 0C
    echo         [!] DNS Cache could not be flushed.
    set "DNS_STATUS=FAILED [!]"
)

echo.


REM =========================================================
REM FINAL SCREEN
REM =========================================================

color 0A

echo.
echo  ╔══════════════════════════════════════════════════════════════════════════════╗
echo  ║                               CLEANUP DONE                                   ║
echo  ╚══════════════════════════════════════════════════════════════════════════════╝
echo.
echo  [1] User TEMP              : %TEMP_STATUS%
echo  [2] Windows TEMP           : %WINDOWS_TEMP_STATUS%
echo  [3] Windows Error Reports  : %WER_STATUS%
echo  [4] Thumbnail Cache        : %THUMBNAIL_STATUS%
echo  [5] Recycle Bin            : %RECYCLE_STATUS%
echo  [6] DNS Cache              : %DNS_STATUS%
echo.
echo  ────────────────────────────────────────────────────────────────────────────────
echo          Some files may remain because Windows is currently using them.
echo  ────────────────────────────────────────────────────────────────────────────────
echo.

color 0B
echo  Press any key to exit...
pause >nul

endlocal
