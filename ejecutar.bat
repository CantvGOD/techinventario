@echo off
chcp 65001 >nul
title TechInventario - Sistema Telecom con MySQL y Modo Autónomo (IUJO)
cls

echo ===============================================================================
echo   📱 TECHINVENTARIO - SISTEMA DE GESTION DE INVENTARIO Y VENTAS (TELECOM)
echo   Instituto Universitario de Jesus Obrero (IUJO)
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

:: Verificar si node ya esta en PATH
where node >nul 2>nul
if %errorlevel% equ 0 goto NODE_READY

:: Verificar si existe node portable en .bin\node
if exist "%~dp0.bin\node\node.exe" (
    set "PATH=%~dp0.bin\node;%PATH%"
    set "NODE_CMD=%~dp0.bin\node\node.exe"
    set "NPM_CMD=%~dp0.bin\node\npm.cmd"
    goto NODE_READY
)

echo [1/5] Node.js no fue detectado en el sistema.
echo       Intentando instalacion automatica para Windows...
echo.

:: Opcion A: Intentar con Winget (Windows 10 / 11 nativo)
where winget >nul 2>nul
if %errorlevel% equ 0 (
    echo [INFO] Descargando Node.js mediante Windows Package Manager (winget)...
    winget install OpenJS.NodeJS.LTS -e --silent --accept-package-agreements --accept-source-agreements
    where node >nul 2>nul
    if %errorlevel% equ 0 goto NODE_READY
)

:: Opcion B: Descarga portable mediante PowerShell
echo [INFO] Descargando version portable de Node.js (sin requerir permisos de administrador)...
mkdir "%~dp0.bin" 2>nul

powershell -ExecutionPolicy Bypass -Command ^
    "$ProgressPreference = 'SilentlyContinue'; " ^
    "Write-Host 'Descargando paquete Node.js LTS portable (esto puede tardar unos segundos)...'; " ^
    "Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.18.0/node-v20.18.0-win-x64.zip' -OutFile '%~dp0.bin\node.zip'; " ^
    "Write-Host 'Extrayendo Node.js...'; " ^
    "Expand-Archive -Path '%~dp0.bin\node.zip' -DestinationPath '%~dp0.bin' -Force; " ^
    "Move-Item -Path '%~dp0.bin\node-v20.18.0-win-x64\*' -Destination '%~dp0.bin\node' -Force; " ^
    "Remove-Item -Path '%~dp0.bin\node.zip' -Force;"

if exist "%~dp0.bin\node\node.exe" (
    set "PATH=%~dp0.bin\node;%PATH%"
    set "NODE_CMD=%~dp0.bin\node\node.exe"
    set "NPM_CMD=%~dp0.bin\node\npm.cmd"
    echo [OK] Node.js portable instalado exitosamente en .bin\node\
    goto NODE_READY
)

echo.
echo [ERROR CRITICO] No se pudo instalar Node.js automaticamente.
echo Por favor descarga e instala Node.js desde: https://nodejs.org/
echo y vuelve a hacer doble clic en este archivo.
pause
exit /b 1

:NODE_READY
echo [1/5] Entorno Node.js verificado y listo.
echo.

:: -----------------------------------------------------------------------------
:: PASO 2: VERIFICAR DEPENDENCIAS (node_modules)
:: -----------------------------------------------------------------------------
if not exist "%~dp0node_modules" (
    echo [2/5] Descargando e instalando librerias del proyecto (npm install)...
    echo       Esto solo ocurre la primera vez. Por favor espera...
    echo.
    call "%NPM_CMD%" install
    if %errorlevel% neq 0 (
        echo [ERROR] Ocurrio un fallo durante npm install.
        pause
        exit /b 1
    )
) else (
    echo [2/5] Librerias y dependencias instaladas correctamente.
)
echo.

:: -----------------------------------------------------------------------------
:: PASO 3: ASEGURAR COMPILACION FRONTEND (dist)
:: -----------------------------------------------------------------------------
if not exist "%~dp0dist\index.html" (
    echo [3/5] Compilando interfaz web de usuario (npm run build)...
    call "%NPM_CMD%" run build
) else (
    echo [3/5] Interfaz web lista (bundle compilado).
)
echo.

:: -----------------------------------------------------------------------------
:: PASO 4: BASE DE DATOS (MYSQL O MOTOR AUTONOMO EMBEBIDO)
:: -----------------------------------------------------------------------------
echo [4/5] Configurando base de datos del sistema...
mkdir "%~dp0data" 2>nul

:: Asegurar copia de respaldo de la base de datos
if not exist "%~dp0data\techinventario_database.json" (
    if exist "%~dp0database.sql" (
        copy /y "%~dp0database.sql" "%~dp0data\database_backup.sql" >nul
        echo [INFO] Respaldo SQL guardado en data\database_backup.sql
    )
)

:: Buscar si MySQL esta instalado o si existe XAMPP
set "MYSQL_BIN="
where mysql >nul 2>nul && set "MYSQL_BIN=mysql"
if exist "C:\xampp\mysql\bin\mysql.exe" set "MYSQL_BIN=C:\xampp\mysql\bin\mysql.exe"
if exist "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" set "MYSQL_BIN=C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
if exist "C:\Program Files\MariaDB 10.11\bin\mysql.exe" set "MYSQL_BIN=C:\Program Files\MariaDB 10.11\bin\mysql.exe"
if exist "C:\Program Files\MariaDB 11.4\bin\mysql.exe" set "MYSQL_BIN=C:\Program Files\MariaDB 11.4\bin\mysql.exe"

if defined MYSQL_BIN (
    echo [INFO] Motor MySQL detectado en: %MYSQL_BIN%
    echo [INFO] Importando esquema y datos de prueba database.sql...
    "%MYSQL_BIN%" -u root -e "CREATE DATABASE IF NOT EXISTS techinventario_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>nul
    "%MYSQL_BIN%" -u root techinventario_db < "%~dp0database.sql" 2>nul
    if %errorlevel% equ 0 (
        echo [OK] Base de datos MySQL sincronizada e importada con exito.
    ) else (
        echo [AVISO] El servicio MySQL no esta iniciado actualmente.
        echo         El sistema usara el motor autonomo local de respaldo.
    )
) else (
    echo [INFO] MySQL no detectado en el equipo (o servicio no iniciado).
    echo [OK] Activado Motor Embebido de Alta Compatibilidad (Zero-Config).
    echo      Todo el sistema funcionara con persistencia local en data\techinventario_database.json.
)
echo.

:: -----------------------------------------------------------------------------
:: PASO 5: EJECUCION DE SERVIDORES Y APERTURA DE NAVEGADOR
:: -----------------------------------------------------------------------------
echo [5/5] Iniciando servidores y abriendo aplicacion...
echo.
echo ===============================================================================
echo   CREDENTIALS DE ACCESO:
echo   - Super Usuario (Jefe): jefe@empresa.com / Clave: 123
echo   - Administrador:        admin@empresa.com / Clave: 123
echo   - Vendedor:             carlos@empresa.com / Clave: 123
echo.
echo   URL Aplicacion: http://localhost:5173/
echo   API Backend:    http://localhost:3001/
echo ===============================================================================
echo.

:: Iniciar Servidor Backend API
start "TechInventario Backend API" /min "%NODE_CMD%" server.cjs

:: Esperar 2 segundos para asegurar enlace
timeout /t 2 /nobreak >nul

:: Abrir navegador en la aplicacion
start http://localhost:5173/

:: Iniciar Servidor Frontend Vite
call "%NPM_CMD%" run dev

:: Si se cierra Vite, mantener ventana abierta
echo.
echo Servidor detenido. Presiona cualquier tecla para salir...
pause >nul
