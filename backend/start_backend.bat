@echo off
cd /d "%~dp0"
echo Iniciando backend Lojas na porta 8001...
call venv\Scripts\activate.bat
uvicorn main:app --reload --host 0.0.0.0 --port 8001
pause
