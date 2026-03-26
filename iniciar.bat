@echo off
echo ==========================================
echo Iniciando My VYM com Docker...
echo ==========================================
echo.
echo Por favor, aguarde. Se esta for a primeira vez, o Docker ira
echo baixar imagens da internet, o que pode demorar alguns minutos.
echo.
docker compose up --build
echo.
pause
