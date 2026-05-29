@echo off
:: =============================================
:: ARCHIVO: install.bat
:: AUTOR: Pedro Antonio Ramírez Alcántara
:: MATERIA: Vinculación Empresarial
:: GRUPO: 2007 (2026-II)
:: DOCENTE: Aarón Velasco Agustín
:: CARRERA: Ingeniería en Computación - FES Aragón
:: FUNCIÓN: Instalador automático de EduInspect para WINDOWS
:: EJECUTAR: Click derecho -> "Ejecutar como administrador"
:: =============================================

title EDUINSPECT - INSTALADOR DEFINITIVO
color 0A

:: =============================================
:: INICIO
:: =============================================
echo ================================================
echo    EDUINSPECT - INSTALACION COMPLETA
echo    FES Aragon - UNAM
echo ================================================
echo.

:: =============================================
:: PASO 1: VERIFICAR DOCKER
:: =============================================
echo [1/6] Verificando Docker...

where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Docker no esta instalado
    echo.
    echo Descarga Docker Desktop desde:
    echo https://docs.docker.com/desktop/install/windows/
    echo.
    pause
    exit /b 1
)

:: Verificar que Docker esté corriendo
docker info >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Docker no esta corriendo
    echo.
    echo Inicia Docker Desktop desde el menu de inicio
    echo Espera a que el icono del tray este verde
    echo.
    pause
    exit /b 1
)

echo [OK] Docker instalado y corriendo
echo.

:: =============================================
:: PASO 2: VERIFICAR NODE.JS
:: =============================================
echo [2/6] Verificando Node.js...

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [AVISO] Node.js no instalado
    echo Instalando Node.js...
    
    :: Descargar e instalar Node.js
    curl -L -o node_installer.msi https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi
    msiexec /i node_installer.msi /quiet /norestart
    del node_installer.msi
    
    :: Actualizar PATH
    set "PATH=%PATH%;C:\Program Files\nodejs"
)

echo [OK] Node.js instalado
echo.

:: =============================================
:: PASO 3: CREAR ESTRUCTURA DE CARPETAS
:: =============================================
echo [3/6] Creando estructura de carpetas...

:: Backend
mkdir backend\app\routers 2>nul
mkdir backend\app\utils 2>nul
mkdir backend\prisma 2>nul
mkdir backend\static\uploads 2>nul

:: Frontend
mkdir frontend\app\dashboard\reports\[id]\edit 2>nul
mkdir frontend\app\dashboard\reports\new 2>nul
mkdir frontend\app\dashboard\staff\[id] 2>nul
mkdir frontend\app\dashboard\messages 2>nul
mkdir frontend\app\login 2>nul
mkdir frontend\components 2>nul
mkdir frontend\lib 2>nul
mkdir frontend\config 2>nul
mkdir frontend\public\images 2>nul
mkdir frontend\hooks 2>nul
mkdir frontend\types 2>nul

:: Scripts y database
mkdir scripts 2>nul
mkdir database 2>nul

echo [OK] Carpetas creadas
echo.

:: =============================================
:: PASO 4: CREAR ARCHIVOS DE CONFIGURACION
:: =============================================
echo [4/6] Configurando archivos...

if not exist ".env" (
    (
        echo DATABASE_URL="postgresql://postgres:postgres@postgres:5432/eduinspect"
        echo SECRET_KEY=tu-secret-key-cambiame-en-produccion
        echo ALGORITHM=HS256
        echo ACCESS_TOKEN_EXPIRE_MINUTES=30
    ) > .env
    echo [OK] Archivo .env creado
) else (
    echo [OK] Archivo .env ya existe
)

if not exist "backend\.env" (
    (
        echo DATABASE_URL="postgresql://postgres:postgres@postgres:5432/eduinspect"
    ) > backend\.env
    echo [OK] Archivo backend\.env creado
)

echo.

:: =============================================
:: PASO 5: INSTALAR DEPENDENCIAS
:: =============================================
echo [5/6] Instalando dependencias...

:: Backend (Python)
if exist "backend\requirements.txt" (
    echo Instalando dependencias de Python...
    pip install -r backend\requirements.txt
    echo [OK] Dependencias de Python instaladas
) else (
    echo [ERROR] backend\requirements.txt no encontrado
)

:: Frontend (Node.js)
if exist "frontend\package.json" (
    echo Instalando dependencias de Node.js...
    cd frontend
    call npm install --legacy-peer-deps
    cd ..
    echo [OK] Dependencias de Node.js instaladas
) else (
    echo [ERROR] frontend\package.json no encontrado
)

echo.

:: =============================================
:: PASO 6: LEVANTAR CONTENEDORES DOCKER
:: =============================================
echo [6/6] Levantando contenedores Docker...

:: Detener contenedores existentes
docker compose down 2>nul

:: Construir y levantar
docker compose up -d --build

if %errorlevel% neq 0 (
    echo [ERROR] Error al levantar contenedores
    echo.
    echo Posibles soluciones:
    echo   1. Reinicia Docker Desktop
    echo   2. Verifica los puertos 3000, 8000, 5432
    echo   3. Ejecuta nuevamente como administrador
    echo.
    pause
    exit /b 1
)

echo [OK] Contenedores levantados
echo.

echo Esperando inicializacion...
timeout /t 15 /t 15 /nobreak >nul

 /nobreak >nul

:: =========================================:: =============================================
:: MENSAJE FINAL====
:: MENSAJE FINAL
:: =============================================

:: =============================================
cls
echo =================================cls
echo ================================================
echo===============
echo    INSTALACION COMPLETADA CON    INSTALACION COMPLETADA CON EXITO
echo EXITO
echo = ================================================================================
echo.
echo 📌 ACC===============
echo.
echo 📌 ACCESOS DEL PROESOS DEL PROYECTO:
YECTO:
echo.
echo   echo.
echo    Frontend ( Frontend (Next.js):   Next.js):    http://localhost: http://localhost:3000
echo    Login:                3000
echo    Login:                 http://localhost:3000/login
 http://localhost:3000/login
echo    Backendecho    Backend (FastAPI): (FastAPI):     http://localhost:8000     http://localhost:800
echo    Documentacion0
echo    Documentacion API:     http API:     http://localhost:800://localhost:8000/docs
echo.
echo 🔑0/docs
echo.
echo 🔑 CREDENCIAL CREDENCIALES DE PRUEBA:
echo.
echo   ES DE PRUEBA:
echo.
 Administradorecho    Administrador: pia@: pia@edusync.comedusync.com / admin123
 /echo    Coordinador:   coordin admin123
echo    Coordinador@edusador:   coordinador@edusync.com / Unam26!#"
echo    Tecync.com / Unam26!#"
echo    Tecniconico:      :       tecnico@ed tecnico@edusync.com / Unamusync.com / Unam26!#"
echo    Inspector26!#"
echo    Inspector:     inspector@:     inspector@edusyncedusync.com /.com / Unam26!#"
 Unam26!#"
echo.
echo 📝 COMecho.
echo 📝 COMANDOS UTANDOS UTILES:
echo.
ILES:
echo.
echo    Verecho    Ver logs:          docker compose logs:          docker compose logs -f
echo    Detener todo logs -f
echo    Detener todo:      docker compose down
echo    Reiniciar todo:    docker compose restart
echo   :      docker compose down
echo    Reiniciar todo:    docker compose restart
echo    Reconstru Reconstruir:       docker compose up -d --build
echo.
echo ================================================
echo.
ir:       docker compose up -d --build
echo.
echo ================================================
echo.
pause