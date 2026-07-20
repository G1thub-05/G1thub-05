@echo off
echo Cleaning system junk...

del /s /f /q %temp%\*
del /s /f /q C:\Windows\Temp\*
del /s /f /q C:\Windows\Prefetch\*

echo Cleanup complete.
pause