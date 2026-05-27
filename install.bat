@echo off
title EDUINSPECT - INSTALADOR DEFINITIVO
color 0A

echo ================================================
echo    EDUINSPECT - INSTALACION DEFINITIVA
echo ================================================
echo.

:: Verificar Docker
echo [1/4] Verificando Docker...
where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Docker no esta instalado
    pause
    exit /b 1
)
echo [OK] Docker instalado
echo.

:: Crear carpetas
echo [2/4] Creando estructura...
mkdir backend\app 2>nul
mkdir backend\prisma 2>nul
mkdir frontend\app\login 2>nul
mkdir frontend\app\dashboard 2>nul
mkdir frontend\public 2>nul
mkdir scripts 2>nul
echo [OK] Carpetas creadas
echo.

:: Levantar contenedores
echo [3/4] Levantando contenedores...
docker compose up -d --build
echo [OK] Contenedores levantados
echo.

timeout /t 10 /nobreak >nul

:: Mensaje final
echo ================================================
echo    INSTALACION COMPLETADA
echo ================================================
echo.
echo Accesos:
echo   Frontend: http://localhost:3000/login
echo   Backend: http://localhost:8000/docs
echo.
echo Credenciales:
echo   admin@edusync.com / admin123
echo.
pause