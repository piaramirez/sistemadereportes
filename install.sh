#!/bin/bash

# =============================================
# EDUINSPECT - INSTALADOR AUTOMÁTICO
# Ejecutar: ./install.sh
# =============================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}   EDUINSPECT - INSTALANDO TODO${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# =============================================
# 1. VERIFICAR REQUISITOS DEL SISTEMA
# =============================================
echo -e "${YELLOW}[1/6] Verificando requisitos...${NC}"

# Verificar Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python3 no está instalado${NC}"
    echo "Instalar con: sudo dnf install python3.11 python3.11-pip -y"
    exit 1
fi
echo -e "${GREEN}✅ Python3: $(python3 --version)${NC}"

# Verificar pip
if ! command -v pip3 &> /dev/null; then
    echo -e "${RED}❌ pip3 no está instalado${NC}"
    exit 1
fi
echo -e "${GREEN}✅ pip3: $(pip3 --version)${NC}"

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js no está instalado${NC}"
    echo "Instalar con: curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash - && sudo dnf install nodejs -y"
    exit 1
fi
echo -e "${GREEN}✅ Node.js: $(node --version)${NC}"

# Verificar npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm no está instalado${NC}"
    exit 1
fi
echo -e "${GREEN}✅ npm: $(npm --version)${NC}"

# Verificar Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker no está instalado${NC}"
    echo "Instalar con: sudo dnf install docker-ce docker-ce-cli containerd.io docker-compose-plugin -y"
    exit 1
fi
echo -e "${GREEN}✅ Docker: $(docker --version)${NC}"
echo ""

# =============================================
# 2. INSTALAR DEPENDENCIAS BACKEND (Python)
# =============================================
echo -e "${YELLOW}[2/6] Instalando dependencias de backend...${NC}"
cd backend

# Crear entorno virtual si no existe
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo -e "${GREEN}✅ Entorno virtual creado${NC}"
fi

# Activar entorno virtual
source venv/bin/activate

# Actualizar pip
pip install --upgrade pip

# Instalar dependencias
pip install fastapi uvicorn python-dotenv prisma python-jose[cryptography] passlib[bcrypt] python-multipart pydantic[email] sendgrid reportlab openpyxl httpx Pillow

# Guardar dependencias en requirements.txt
pip freeze > requirements.txt

cd ..
echo -e "${GREEN}✅ Backend listo${NC}"
echo ""

# =============================================
# 3. INSTALAR DEPENDENCIAS FRONTEND (Next.js)
# =============================================
echo -e "${YELLOW}[3/6] Instalando dependencias de frontend...${NC}"
cd frontend

# Verificar si es un proyecto Next.js
if [ ! -f "package.json" ]; then
    echo -e "${YELLOW}⚠️ Creando nuevo proyecto Next.js...${NC}"
    npx create-next-app@latest . --typescript --tailwind --eslint --app --use-npm --yes
fi

# Instalar dependencias
npm install axios jwt-decode react-hook-form @tanstack/react-query date-fns recharts lucide-react

cd ..
echo -e "${GREEN}✅ Frontend listo${NC}"
echo ""

# =============================================
# 4. LEVANTAR BASE DE DATOS (Docker)
# =============================================
echo -e "${YELLOW}[4/6] Levantando base de datos con Docker...${NC}"

# Verificar si docker-compose.yml existe
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}❌ No existe docker-compose.yml${NC}"
    exit 1
fi

# Levantar contenedores
docker compose up -d

# Esperar a que PostgreSQL esté listo
sleep 5

echo -e "${GREEN}✅ Base de datos corriendo${NC}"
echo ""

# =============================================
# 5. EJECUTAR SCHEMA DE BASE DE DATOS
# =============================================
echo -e "${YELLOW}[5/6] Ejecutando schema.sql...${NC}"

# Verificar que el contenedor existe
if docker ps | grep -q "edusync_postgres"; then
    docker exec -i edusync_postgres psql -U postgres -d edusync < schema.sql
    echo -e "${GREEN}✅ Schema ejecutado${NC}"
else
    echo -e "${RED}⚠️ Contenedor no encontrado, ejecutar manualmente:${NC}"
    echo "docker exec -i sistemsync_postgres psql -U postgres -d edusync < schema.sql"
fi
echo ""

# =============================================
# 6. CONFIGURACIÓN FINAL
# =============================================
echo -e "${YELLOW}[6/6] Configurando variables de entorno...${NC}"

# Crear .env para backend
cat > backend/.env << 'EOF'
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/edusync"
SECRET_KEY="mi-super-secreto-cambiame-en-produccion"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=30
EOF

echo -e "${GREEN}✅ Variables de entorno creadas${NC}"
echo ""

# =============================================
# MENSAJE FINAL
# =============================================
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}✅ INSTALACIÓN COMPLETADA CON ÉXITO${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo -e "${YELLOW}📌 Para iniciar el proyecto:${NC}"
echo ""
echo -e "  ${BLUE}Terminal 1 - Backend:${NC}"
echo "    cd backend"
echo "    source venv/bin/activate"
echo "    uvicorn app.main:app --reload --port 8000"
echo ""
echo -e "  ${BLUE}Terminal 2 - Frontend:${NC}"
echo "    cd frontend"
echo "    npm run dev"
echo ""
echo -e "  ${BLUE}Acceder:${NC}"
echo "    http://localhost:3000/login"
echo ""
echo -e "  ${BLUE}Credenciales de prueba:${NC}"
echo "    admin@edusync.com / admin123"
echo ""