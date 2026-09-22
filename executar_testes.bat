@echo off
echo ========================================================
echo Executando Testes Automatizados - Modulo Lojas
echo ========================================================
cd /d "%~dp0backend"
.\venv\Scripts\python.exe -m pytest tests -v
pause
