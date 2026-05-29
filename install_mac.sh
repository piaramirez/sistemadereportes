#!/bin/bash
# =============================================
# INSTALADOR EDUINSPECT - macOS/Linux
# =============================================

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

clear
echo "================================================"
echo "   EDUINSPECT - INSTALACION COMPLETA"
echo "   FES Aragon - UNAM"
echo "================================================"
echo ""

# ============================================
# 1. VERIFICAR DOCKER
# ============================================
echo -e "${BLUE}[1/4] Verificando Docker...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}================================================${NC}"
    echo -e "${RED}[ERROR] DOCKER NO ESTA INSTALADO${NC}"
    echo -e "${RED}================================================${NC}"
    echo ""
    echo "Descarga Docker Desktop desde:"
    echo "https://www.docker.com/products/docker-desktop/"
    echo ""
    echo "Instalalo y reinicia tu Mac"
    echo ""
    read -p "Presiona ENTER para salir..."
    exit 1
fi

if ! docker info &> /dev/null; then
    echo -e "${RED}================================================${NC}"
    echo -e "${RED}[ERROR] DOCKER NO ESTA CORRIENDO${NC}"
    echo -e "${RED}================================================${NC}"
    echo ""
    echo "1. Abre Docker Desktop desde Aplicaciones"
    echo "2. Espera a que el icono del tray se ponga VERDE"
    echo "3. Vuelve a ejecutar este instalador"
    echo ""
    read -p "Presiona ENTER para salir..."
    exit 1
fi

echo -e "${GREEN}[OK] Docker esta funcionando correctamente${NC}"
echo ""

# ============================================
# 2. CREAR .ENV
# ============================================
echo -e "${BLUE}[2/4] Creando archivo de configuracion...${NC}"

if [ ! -f ".env" ]; then
    cat > .env << EOF
DATABASE_URL="postgresql://postgres:postgres@postgres:5432/edusync"
SECRET_KEY="mi-super-secreto-cambiame-en-produccion"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=30
EOF
    echo -e "${GREEN}[OK] Archivo .env creado${NC}"
else
    echo -e "${GREEN}[OK] Archivo .env ya existe${NC}"
fi
echo ""

# ============================================
# 3. LIMPIAR CONTENEDORES VIEJOS
# ============================================
echo -e "${BLUE}[3/4] Limpiando instalaciones anteriores...${NC}"

docker compose down -v 2>/dev/null
docker system prune -f 2>/dev/null

echo -e "${GREEN}[OK] Limpieza completada${NC}"
echo ""

# ============================================
# 4. CONSTRUIR Y LEVANTAR
# ============================================
echo -e "${BLUE}[4/4] Construyendo y levantando contenedores...${NC}"
echo "================================================"
echo "Esto tomara entre 3 y 5 minutos"
echo "NO cierres esta ventana"
echo "================================================"
echo ""

# Construir primero el backend
echo -e "${YELLOW}Construyendo backend...${NC}"
docker compose build backend --no-cache
if [ $? -ne 0 ]; then
    echo -e "${RED}[ERROR] Fallo la construccion del backend${NC}"
    read -p "Presiona ENTER para salir..."
    exit 1
fi

# Construir el frontend
echo ""
echo -e "${YELLOW}Construyendo frontend...${NC}"
docker compose build frontend --no-cache
if [ $? -ne 0 ]; then
    echo -e "${RED}[ERROR] Fallo la construccion del frontend${NC}"
    read -p "Presiona ENTER para salir..."
    exit 1
fi

# Levantar todo
echo ""
echo -e "${YELLOW}Levantando contenedores...${NC}"
docker compose up -d
if [ $? -ne 0 ]; then
    echo -e "${RED}[ERROR] Fallo al levantar los contenedores${NC}"
    read -p "Presiona ENTER para salir..."
    exit 1
fi

# Esperar a que todo inicie
echo ""
echo "Esperando a que los servicios inicien..."
sleep 10

# Verificar que los contenedores estan corriendo
echo ""
echo "Verificando estado de contenedores..."
docker ps --format "table {{.Names}}\t{{.Status}}"

# Activar usuarios si existe la tabla
echo ""
echo "Activando usuarios en la base de datos..."
docker exec edusync_postgres psql -U postgres -d edusync -c "UPDATE users SET is_active = true;" 2>/dev/null

# ============================================
# MENSAJE FINAL
# ============================================
clear
echo "================================================"
echo -e "${GREEN}   ¡INSTALACION COMPLETADA CON EXITO!${NC}"
echo "================================================"
echo ""
echo "🌐 ACCESOS:"
echo ""
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:8000/docs"
echo "   Base de datos: localhost:5433"
echo ""
echo "🔑 CREDENCIALES DE PRUEBA:"
echo ""
echo "   Administrador: pia@edusync.com / admin123"
echo "   Coordinador:   coordinador@edusync.com / Unam26!#\""
echo "   Tecnico:       tecnico@edusync.com / Unam26!#\""
echo "   Inspector:     inspector@edusync.com / Unam26!#\""
echo ""
echo "================================================"
echo "   COMANDOS UTILES"
echo "================================================"
echo ""
echo "   Ver todos los logs:"
echo "   docker compose logs -f"
echo ""
echo "   Ver solo el frontend:"
echo "   docker compose logs frontend -f"
echo ""
echo "   Ver solo el backend:"
echo "   docker compose logs backend -f"
echo ""
echo "   Detener todo:"
echo "   docker compose down"
echo ""
echo "   Reconstruir todo:"
echo "   docker compose down -v && docker compose up -d --build"
echo ""
echo "================================================"
echo ""
read -p "Presiona ENTER para salir..."