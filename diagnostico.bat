@echo off
echo ==========================================
echo Diagnosticando Docker - My VYM
echo ==========================================
echo.
echo 1. Verificando containers ativos...
docker ps -a --filter name=my-vym
echo.
echo 2. Coletando logs do container (se houver)...
docker logs --tail 50 my-vym-app-1 2>&1
echo.
echo 3. Verificando se o arquivo de banco de dados existe localmente...
if exist consultoria.db (echo O banco consultoria.db existe.) else (echo O banco consultoria.db NÃO existe.)
echo.
echo ==========================================
echo Copie e cole o resultado acima no chat.
pause
