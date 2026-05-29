#!/bin/bash
# =============================================
# ARCHIVO: install_mac.sh
# AUTOR: Pedro Antonio Ramírez Alcántara
# MATERIA: Vinculación Empresarial
# GRUPO: 2007 (2026-II)
# DOCENTE: Aarón Velasco Agustín
# CARRERA: Ingeniería en Computación - FES Aragón
# FUNCIÓN: Instalador automático de EduInspect para MAC
# =============================================

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Función para imprimir banners
print_banner() {
    clear
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}   EDUINSPECT - INSTALACIÓN COMPLETA${NC}"
    echo -e "${BLUE}   FES Aragón - UNAM${NC}"
    echo -e "${BLUE}================================================${NC}"
    echo ""
}

# Función para imprimir pasos
print_step() {
    echo -e "${CYAN}[$1/7] $2${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_info() {
    echo -e "${MAGENTA}ℹ️ $1${NC}"
}

# Verificar si el último comando fue exitoso
check_error() {
    if [ $? -ne 0 ]; then
        print_error "$1"
        exit 1
    fi
}

# Verificar Homebrew
check_homebrew() {
    if ! command -v brew &> /dev/null; then
        print_warning "Homebrew no instalado. Instalando..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    fi
}

# Inicio del script
print_banner

# =============================================
# PASO 1: VERIFICAR HOMEBREW
# =============================================
print_step "1" "Verificando Homebrew..."
check_homebrew
print_success "Homebrew listo"
echo ""

# =============================================
# PASO 2: VERIFICAR DOCKER
# =============================================
print_step "2" "Verificando Docker..."

if ! command -v docker &> /dev/null; then
    print_error "Docker no está instalado"
    print_info "Descarga Docker Desktop desde: https://docs.docker.com/desktop/install/mac/"
    print_info "Luego ejecuta este script nuevamente"
    exit 1
fi

# Verificar que Docker esté corriendo
docker info &> /dev/null
if [ $? -ne 0 ]; then
    print_error "Docker no está corriendo"
    print_info "Inicia Docker Desktop desde Aplicaciones"
    exit 1
fi

print_success "Docker instalado y corriendo"
echo ""

# =============================================
# PASO 3: VERIFICAR NODE.JS
# =============================================
print_step "3" "Verificando Node.js..."

if ! command -v node &> /dev/null; then
    print_warning "Node.js no instalado, instalando con Homebrew..."
    brew install node@20
    brew link --overwrite node@20
fi
print_success "Node.js $(node --version) instalado"
echo ""

# =============================================
# PASO 4: VERIFICAR PYTHON
# =============================================
print_step "4" "Verificando Python..."

if ! command -v python3 &> /dev/null; then
    print_warning "Python no instalado, instalando con Homebrew..."
    brew install python@3.11
fi
print_success "Python $(python3 --version) instalado"
echo ""

# =============================================
# PASO 5: CREAR ESTRUCTURA DE CARPETAS
# =============================================
print_step "5" "Creando estructura de carpetas..."

# Backend
mkdir -p backend/app/routers backend/app/utils backend/prisma backend/static/uploads

# Frontend
mkdir -p frontend/app/dashboard/reports/[id]/edit
mkdir -p frontend/app/dashboard/reports/new
mkdir -p frontend/app/dashboard/staff/[id]
mkdir -p frontend/app/dashboard/messages
mkdir -p frontend/app/login
mkdir -p frontend/components
mkdir -p frontend/lib
mkdir -p frontend/config
mkdir -p frontend/public/images
mkdir -p frontend/hooks
mkdir -p frontend/types

# Scripts y database
mkdir -p scripts database

print_success "Estructura de carpetas creada"
echo ""

# =============================================
# PASO 6: INSTALAR DEPENDENCIAS
# =============================================
print_step "6" "Instalando dependencias..."

# Backend (Python)
if [ -f "backend/requirements.txt" ]; then
    print_info "Instalando dependencias de Python..."
    pip3 install -r backend/requirements.txt
    check_error "Error al instalar dependencias de Python"
    print_success "Dependencias de Python instaladas"
else
    print_error "backend/requirements.txt no encontrado"
fi

# Frontend (Node.js)
if [ -f "frontend/package.json" ]; then
    print_info "Instalando dependencias de Node.js..."
    cd frontend
    npm install --legacy-peer-deps
    check_error "Error al instalar dependencias de Node.js"
    cd ..
    print_success "Dependencias de Node.js instaladas"
else
    print_error "frontend/package.json no encontrado"
fi
echo ""

# =============================================
# PASO 7: LEVANTAR CONTENEDORES DOCKER
# =============================================
print_step "7" "Levantando contenedores Docker..."

# Detener contenedores existentes
docker compose down 2>/dev/null

# Construir y levantar
docker compose up -d --build

if [ $? -ne 0 ]; then
    print_error "Error al levantar contenedores"
    exit 1
fi

print_success "Contenedores levantados exitosamente"
echo ""

# Esperar inicialización
print_info "Esperando 15 segundos para inicialización..."
sleep 15

# =============================================
# MENSAJE FINAL
# =============================================
clear
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}✅ INSTALACIÓN COMPLETADA CON ÉXITO${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo -e "${YELLOW}📌 ACCESOS DEL PROYECTO:${NC}"
echo "   Frontend (Next.js):    ${CYAN}http://localhost:3000${NC}"
echo "   Login:                 ${CYAN}http://localhost:3000/login${NC}"
echo "   Backend (FastAPI):     ${CYAN}http://localhost:8000${NC}"
echo "   API Docs (Swagger):    ${CYAN}http://localhost:8000/docs${NC}"
echo ""
echo -e "${YELLOW}🔑 CREDENCIALES DE PRUEBA:${NC}"
echo "   Administrador: ${CYAN}pia@edusync.com / admin123${NC}"
echo "   Coordinador:   ${CYAN}coordinador@edusync.com / Unam26!#${NC}"
echo "   Técnico:       ${CYAN}tecnico@edusync.com / Unam26!#${NC}"
echo "   Inspector:     ${CYAN}inspector@edusync.com / Unam26!#${NC}"
echo ""
echo -e "${YELLOW}📝 COMANDOS ÚTILES:${NC}"
echo "   Ver logs:        ${CYAN}docker compose logs -f${NC}"
echo "   Detener todo:    ${CYAN}docker compose down${NC}"
echo "   Reiniciar todo:  ${CYAN}docker compose restart${NC}"
echo "   Reconstruir:     ${CYAN}docker compose up -d --build${NC}"
echo ""
echo -e "${GREEN}================================================${NC}"