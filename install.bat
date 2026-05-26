@echo off
title EDUINSPECT - INSTALADOR AUTOMATICO
color 0A

echo ================================================
echo    EDUINSPECT - INSTALANDO TODO
echo ================================================
echo.

:: ============================================
:: 1. VERIFICAR REQUISITOS
:: ============================================
echo [1/6] Verificando requisitos...

where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python no esta instalado
    echo Descargar desde: https://www.python.org/downloads/
    pause
    exit /b 1
)
echo [OK] Python: 
python --version

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no esta instalado
    pause
    exit /b 1
)
echo [OK] Node.js: 
node --version

where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Docker no esta instalado
    pause
    exit /b 1
)
echo [OK] Docker instalado
echo.

:: ============================================
:: 2. INSTALAR BACKEND
:: ============================================
echo [2/6] Instalando dependencias de backend...
cd backend

if not exist "venv" (
    python -m venv venv
)

call venv\Scripts\activate.bat
pip install --upgrade pip
pip install fastapi uvicorn python-dotenv prisma python-jose[cryptography] passlib[bcrypt] python-multipart pydantic[email] sendgrid reportlab openpyxl httpx Pillow
pip freeze > requirements.txt

cd ..
echo [OK] Backend listo
echo.

:: ============================================
:: 3. INSTALAR FRONTEND
:: ============================================
echo [3/6] Instalando dependencias de frontend...
cd frontend

if not exist "package.json" (
    call npx create-next-app@latest . --typescript --tailwind --eslint --app --use-npm --yes
)

call npm install axios jwt-decode react-hook-form @tanstack/react-query date-fns recharts lucide-react

cd ..
echo [OK] Frontend listo
echo.

:: ============================================
:: 4. LEVANTAR BD
:: ============================================
echo [4/6] Levantando base de datos...
docker compose up -d
timeout /t 5 /nobreak >nul
echo [OK] Base de datos corriendo
echo.

:: ============================================
:: 5. EJECUTAR SCHEMA
:: ============================================
echo [5/6] Ejecutando schema.sql...
docker exec -i edusync_postgres psql -U postgres -d edusync < schema.sql
echo [OK] Schema ejecutado
echo.

:: ============================================
:: 6. VARIABLES DE ENTORNO
:: ============================================
echo [6/6] Creando variables de entorno...
(
echo DATABASE_URL="postgresql://postgres:postgres@localhost:5433/edusync"
echo SECRET_KEY="mi-super-secreto-cambiame-en-produccion"
echo ALGORITHM="HS256"
echo ACCESS_TOKEN_EXPIRE_MINUTES=30
) > backend\.env
echo [OK] Variables creadas
echo.

:: ============================================
:: MENSAJE FINAL
:: ============================================
echo ================================================
echo    INSTALACION COMPLETADA
echo ================================================
echo.
echo Para iniciar el proyecto:
echo.
echo Backend:
echo   cd backend
echo   venv\Scripts\activate
echo   uvicorn app.main:app --reload --port 8000
echo.
echo Frontend:
echo   cd frontend
echo   npm run dev
echo.
echo Acceder: http://localhost:3000/login
echo.
pause