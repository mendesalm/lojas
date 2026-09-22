@echo off
echo ========================================================
echo Iniciando Servidor Backend - Modulo Lojas (Porta 8001)
echo ========================================================
cd /d "%~dp0backend"
if exist venv\Scripts\python.exe (
    .\venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload
) else (
    echo [ERRO] Ambiente virtual nao encontrado em backend\venv.
    pause
)
