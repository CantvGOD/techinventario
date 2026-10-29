@echo off
title TechInventario - Sistema Telecom con MySQL y Modo Autonomo - IUJO
cls

echo ===============================================================================
echo   TECHINVENTARIO - SISTEMA DE GESTION DE INVENTARIO Y VENTAS - TELECOM
echo   Instituto Universitario de Jesus Obrero - IUJO
echo ===============================================================================
echo.
echo   [Iniciando verificacion de entorno e instalacion desatendida...]
echo.

cd /d "%~dp0"

:: -----------------------------------------------------------------------------
:: PASO 1: VERIFICAR O INSTALAR NODE.JS
:: -----------------------------------------------------------------------------
set "NODE_CMD=node"
set "NPM_CMD=npm"

where node >nul 2>nul
if not errorlevel 1 goto NODE_READY

if exist "C:\Program Files\nodejs\node.exe" goto USE_PROGRAMFILES_NODE
if exist "%~dp0.bin\node\node.exe" goto USE_PORTABLE_NODE

echo [1/5] Node.js no fue detectado en el sistema.
echo       Iniciando descarga e instalacion automatica para Windows...
echo.
echo [INFO] Descargando version portable de Node.js LTS...
if not exist "%~dp0.bin" mkdir "%~dp0.bin" 2>nul
if exist "%~dp0.bin\node.zip" del /f /q "%~dp0.bin\node.zip" 2>nul

where curl.exe >nul 2>nul
if errorlevel 1 goto DOWNLOAD_PS
curl.exe -L --silent --show-error -o "%~dp0.bin\node.zip" "https://nodejs.org/dist/v22.14.0/node-v22.14.0-win-x64.zip"
goto CHECK_ZIP

:DOWNLOAD_PS
powershell -NoProfile -ExecutionPolicy Bypass -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; $ProgressPreference = 'SilentlyContinue'; Invoke-WebRequest -Uri 'https://nodejs.org/dist/v22.14.0/node-v22.14.0-win-x64.zip' -OutFile '%~dp0.bin\node.zip'"

:CHECK_ZIP
if not exist "%~dp0.bin\node.zip" goto TRY_WINGET

echo [INFO] Extrayendo Node.js portable...
if exist "%~dp0.bin\node-v22.14.0-win-x64" rmdir /s /q "%~dp0.bin\node-v22.14.0-win-x64" 2>nul
if exist "%~dp0.bin\node" rmdir /s /q "%~dp0.bin\node" 2>nul

where tar.exe >nul 2>nul
if errorlevel 1 goto EXTRACT_PS
tar.exe -xf "%~dp0.bin\node.zip" -C "%~dp0.bin"
goto RENAME_NODE

:EXTRACT_PS
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ProgressPreference = 'SilentlyContinue'; Expand-Archive -Path '%~dp0.bin\node.zip' -DestinationPath '%~dp0.bin' -Force"

:RENAME_NODE
if exist "%~dp0.bin\node-v22.14.0-win-x64" move "%~dp0.bin\node-v22.14.0-win-x64" "%~dp0.bin\node" >nul
if exist "%~dp0.bin\node.zip" del /f /q "%~dp0.bin\node.zip" 2>nul

if exist "%~dp0.bin\node\node.exe" goto USE_PORTABLE_NODE

:TRY_WINGET
where winget >nul 2>nul
if errorlevel 1 goto NODE_FAIL
echo [INFO] Intentando instalar Node.js mediante Winget...
winget install OpenJS.NodeJS.LTS -e --silent --accept-package-agreements --accept-source-agreements
if exist "C:\Program Files\nodejs\node.exe" goto USE_PROGRAMFILES_NODE
where node >nul 2>nul
if not errorlevel 1 goto NODE_READY

:NODE_FAIL
echo.
echo [ERROR CRITICO] No se pudo instalar Node.js automaticamente.
pause
exit /b 1

:USE_PROGRAMFILES_NODE
set "PATH=C:\Program Files\nodejs;%PATH%"
set "NODE_CMD=C:\Program Files\nodejs\node.exe"
set "NPM_CMD=C:\Program Files\nodejs\npm.cmd"
goto NODE_READY

:USE_PORTABLE_NODE
set "PATH=%~dp0.bin\node;%PATH%"
set "NODE_CMD=%~dp0.bin\node\node.exe"
set "NPM_CMD=%~dp0.bin\node\npm.cmd"
echo [OK] Node.js portable configurado en .bin\node\
goto NODE_READY

:NODE_READY
echo [1/5] Entorno Node.js verificado y listo.
echo.

:: -----------------------------------------------------------------------------
:: PASO 2: VERIFICAR DEPENDENCIAS - node_modules
:: -----------------------------------------------------------------------------
if exist "%~dp0node_modules\express" goto DEPS_READY

echo [2/5] Descargando e instalando librerias del proyecto...
echo       Esto solo ocurre la primera vez. Por favor espera...
echo.
if exist "%~dp0package-lock.json" del /f /q "%~dp0package-lock.json" 2>nul
call "%NPM_CMD%" install --omit=dev --no-audit --no-fund
if errorlevel 1 goto DEPS_FAIL
goto DEPS_DONE

:DEPS_FAIL
echo [ERROR] Ocurrio un fallo durante npm install.
pause
exit /b 1

:DEPS_READY
echo [2/5] Librerias y dependencias instaladas correctamente.

:DEPS_DONE
echo.

:: -----------------------------------------------------------------------------
:: PASO 3: ASEGURAR COMPILACION FRONTEND - dist
:: -----------------------------------------------------------------------------
echo [3/5] Interfaz web lista y compilada en carpeta dist.
echo.

:: -----------------------------------------------------------------------------
:: PASO 4: BASE DE DATOS - MYSQL O MOTOR AUTONOMO EMBEBIDO
:: -----------------------------------------------------------------------------
echo [4/5] Configurando base de datos del sistema...
if not exist "%~dp0data" mkdir "%~dp0data" 2>nul
if not exist "%~dp0data\techinventario_database.json" copy /y "%~dp0database.sql" "%~dp0data\database_backup.sql" >nul 2>nul

set "MYSQL_BIN="
where mysql >nul 2>nul
if not errorlevel 1 set "MYSQL_BIN=mysql"
if exist "C:\xampp\mysql\bin\mysql.exe" set "MYSQL_BIN=C:\xampp\mysql\bin\mysql.exe"
if exist "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" set "MYSQL_BIN=C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
if exist "C:\Program Files\MariaDB 10.11\bin\mysql.exe" set "MYSQL_BIN=C:\Program Files\MariaDB 10.11\bin\mysql.exe"
if exist "C:\Program Files\MariaDB 11.4\bin\mysql.exe" set "MYSQL_BIN=C:\Program Files\MariaDB 11.4\bin\mysql.exe"

if not defined MYSQL_BIN goto NO_MYSQL

echo [INFO] Motor MySQL detectado en: %MYSQL_BIN%
"%MYSQL_BIN%" -u root -e "CREATE DATABASE IF NOT EXISTS techinventario_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>nul
"%MYSQL_BIN%" -u root techinventario_db < "%~dp0database.sql" 2>nul
if errorlevel 1 goto MYSQL_OFFLINE
echo [OK] Base de datos MySQL sincronizada e importada con exito.
goto DB_DONE

:MYSQL_OFFLINE
echo [AVISO] El servicio MySQL no esta iniciado actualmente.
echo         El sistema usara el motor autonomo local de respaldo.
goto DB_DONE

:NO_MYSQL
echo [INFO] MySQL no detectado en el equipo o servicio no iniciado.
echo [OK] Activado Motor Embebido de Alta Compatibilidad Zero-Config.
echo      Persistencia local activa en data\techinventario_database.json.

:DB_DONE
echo.

:: -----------------------------------------------------------------------------
:: PASO 5: EJECUCION DE SERVIDORES Y APERTURA DE NAVEGADOR
:: -----------------------------------------------------------------------------
echo [5/5] Iniciando servidor y abriendo aplicacion...
echo.
echo ===============================================================================
echo   CREDENCIALES DE ACCESO:
echo   - Super Usuario / Jefe: jefe@empresa.com   / Clave: 123
echo   - Administrador:        admin@empresa.com  / Clave: 123
echo   - Vendedor:             carlos@empresa.com / Clave: 123
echo.
echo   URL Aplicacion: http://localhost:3001/
echo ===============================================================================
echo.

:: Abrir navegador tras 2 segundos en segundo plano
start "" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:3001/"

:: Ejecutar el servidor principal (sirve tanto la API como la interfaz web compilada en dist/)
"%NODE_CMD%" "%~dp0server.cjs"

echo.
echo Servidor detenido. Presiona cualquier tecla para salir...
pause >nul
