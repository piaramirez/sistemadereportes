@echo off
title EDUINSPECT - INSTALADOR WINDOWS
color 0A

echo ================================================
echo    EDUINSPECT - INSTALACION COMPLETA
echo    FES Aragon - UNAM
echo ================================================
echo.

:: ============================================
:: 1. VERIFICAR DOCKER
:: ============================================
echo [1/4] Verificando Docker...

where docker >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo ================================================
    echo [ERROR] DOCKER NO ESTA INSTALADO
    echo ================================================
    echo.
    echo Descarga Docker Desktop desde:
    echo https://www.docker.com/products/docker-desktop/
    echo.
    echo Instalalo y reinicia tu PC
    echo.
    pause
    exit /b 1
)

docker info >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo ================================================
    echo [ERROR] DOCKER NO ESTA CORRIENDO
    echo ================================================
    echo.
    echo 1. Abre Docker Desktop desde el menu de inicio
    echo 2. Espera a que el icono del tray se ponga VERDE
    echo 3. Vuelve a ejecutar este instalador
    echo.
    pause
    exit /b 1
)

echo [OK] Docker esta funcionando correctamente
echo.

:: ============================================
:: 2. CREAR .ENV
:: ============================================
echo [2/4] Creando archivo de configuracion...

if not exist ".env" (
    echo DATABASE_URL="postgresql://postgres:postgres@postgres:5432/edusync" > .env
    echo SECRET_KEY="mi-super-secreto-cambiame-en-produccion" >> .env
    echo ALGORITHM="HS256" >> .env
    echo ACCESS_TOKEN_EXPIRE_MINUTES=30 >> .env
    echo [OK] Archivo .env creado
) else (
    echo [OK] Archivo .env ya existe
)
echo.

:: ============================================
:: 3. LIMPIAR CONTENEDORES VIEJOS
:: ============================================
echo [3/4] Limpiando instalaciones anteriores...

docker compose down -v 2>nul
docker system prune -f 2>nul

echo [OK] Limpieza completada
echo.

:: ============================================
:: 4. CONSTRUIR Y LEVANTAR
:: ============================================
echo [4/4] Construyendo y levantando contenedores...
echo ================================================
echo Esto tomara entre 3 y 5 minutos
echo NO cierres esta ventana
echo ================================================
echo.

:: Construir primero el backend
echo Construyendo backend...
docker compose build backend --no-cache
if %errorlevel% neq 0 (
    echo [ERROR] Fallo la construccion del backend
    pause
    exit /b 1
)

:: Construir el frontend
echo.
echo Construyendo frontend...
docker compose build frontend --no-cache
if %errorlevel% neq 0 (
    echo [ERROR] Fallo la construccion del frontend
    pause
    exit /b 1
)

:: Levantar todo
echo.
echo Levantando contenedores...
docker compose up -d
if %errorlevel% neq 0 (
    echo [ERROR] Fallo al levantar los contenedores
    pause
    exit /b 1
)

:: Esperar a que todo inicie
echo.
echo Esperando a que los servicios inicien...
timeout /t 10 /nobreak >nul

:: Verificar que los contenedores estan corriendo
echo.
echo Verificando estado de contenedores...
docker ps --format "table {{.Names}}\t{{.Status}}"

:: Activar usuarios si existe la tabla
echo.
echo Activando usuarios en la base de datos...
docker exec edusync_postgres psql -U postgres -d edusync -c "UPDATE users SET is_active = true;" 2>nul

:: ============================================
:: MENSAJE FINAL
:: ============================================
cls
echo ================================================
echo    ¡INSTALACION COMPLETADA CON EXITO!
echo ================================================
echo.
echo 🌐 ACCESOS:
echo.
echo    Frontend: http://localhost:3000
echo    Backend:  http://localhost:8000/docs
echo    Base de datos: localhost:5433
echo.
echo 🔑 CREDENCIALES DE PRUEBA:
echo.
echo    Administrador: pia@edusync.com / admin123
echo    Coordinador:   coordinador@edusync.com / Unam26!#"
echo    Tecnico:       tecnico@edusync.com / Unam26!#"
echo    Inspector:     inspector@edusync.com / Unam26!#"
echo.
echo ================================================
echo    COMANDOS UTILES
echo ================================================
echo.
echo    Ver todos los logs:
echo    docker compose logs -f
echo.
echo    Ver solo el frontend:
echo    docker compose logs frontend -f
echo.
echo    Ver solo el backend:
echo    docker compose logs backend -f
echo.
echo    Detener todo:
echo    docker compose down
echo.
echo    Reconstruir todo:
echo    docker compose down -v ^&^& docker compose up -d --build
echo.
echo ================================================
echo.
echo Presiona cualquier tecla para salir...
pause >nul