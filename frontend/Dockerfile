# ==========================================
# ARCHIVO: frontend/Dockerfile
# AUTOR: Pedro Antonio Ramírez Alcántara
# MATERIA: Vinculación Empresarial
# GRUPO: 2007 (2026-II)
# DOCENTE: Aarón Velasco Agustín
# CARRERA: Ingeniería en Computación - FES Aragón
# FUNCIÓN: Contenedor Docker para el frontend Next.js
# VERSION: 2.1 - Compatible con Windows y Linux
# ==========================================

# ==========================================
# BASE DE LA IMAGEN
# ==========================================
FROM node:20-alpine

# ==========================================
# METADATOS DEL AUTOR
# ==========================================
LABEL maintainer="Pedro Antonio Ramírez Alcántara"
LABEL institution="FES Aragón - UNAM"
LABEL project="EduInspect"
LABEL component="frontend"
LABEL version="2.1.0"

# ==========================================
# CONFIGURACIÓN DEL DIRECTORIO DE TRABAJO
# ==========================================
WORKDIR /app

# ==========================================
# OPTIMIZACIÓN PARA WINDOWS Y REDES LENTAS
# ==========================================
# Configurar npm para mejor rendimiento
# NOTA: network-retry-count NO es una opción válida de npm (eliminada)
RUN npm config set registry https://registry.npmjs.org/ && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retry-factor 2

# ==========================================
# INSTALACIÓN DE DEPENDENCIAS (CACHEADO)
# ==========================================
# Copiamos solo package.json primero para aprovechar cache de Docker
COPY package*.json ./

# Instalar dependencias con optimizaciones
# --legacy-peer-deps: resuelve conflictos de peer dependencies
# --no-audit: evita revisión de vulnerabilidades (acelera)
# --no-fund: evita mensajes de funding (acelera)
# --prefer-offline: usa caché si está disponible
RUN npm cache clean --force && \
    npm install --legacy-peer-deps --no-audit --no-fund --prefer-offline

# ==========================================
# COPIA DEL CÓDIGO FUENTE
# ==========================================
# Nota: Con volúmenes montados, esto puede ser sobrescrito
# Pero es necesario para la construcción inicial
COPY . .

# ==========================================
# EXPOSICIÓN DEL PUERTO
# ==========================================
EXPOSE 3000

# ==========================================
# HEALTHCHECK (opcional)
# ==========================================
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD node -e "fetch('http://localhost:3000').then(r=>r.ok?process.exit(0):process.exit(1)).catch(()=>process.exit(1))"

# ==========================================
# SCRIPT DE ENTRADA INTELIGENTE
# ==========================================
# Este script verifica si node_modules existe antes de instalar
# Optimizado para desarrollo con volúmenes montados
RUN printf '#!/bin/sh\n\
set -e\n\
\n\
echo "🚀 Iniciando contenedor frontend..."\n\
\n\
# Verificar si node_modules existe y no está vacío\n\
if [ ! -d "node_modules" ] || [ -z "$(ls -A node_modules 2>/dev/null)" ]; then\n\
    echo "📦 Instalando dependencias faltantes..."\n\
    npm install --legacy-peer-deps --no-audit --no-fund --prefer-offline\n\
else\n\
    echo "✅ node_modules ya existe, omitiendo instalación"\n\
    # Aún así, verificamos si falta algún paquete crítico\n\
    if [ ! -d "node_modules/next" ]; then\n\
        echo "⚠️  Next.js no encontrado, reinstalando..."\n\
        npm install --legacy-peer-deps --no-audit --no-fund\n\
    fi\n\
fi\n\
\n\
echo "🎯 Iniciando Next.js en modo desarrollo..."\n\
exec npm run dev\n\
' > /usr/local/bin/docker-entrypoint.sh && chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

# ==========================================
# NOTAS PARA EL DESPLIEGUE:
# ==========================================
#
# 1. CONSTRUIR LA IMAGEN:
#    docker build -t eduinspect-frontend -f frontend/Dockerfile ./frontend
#
# 2. CON DOCKER COMPOSE:
#    docker compose up frontend
#
# 3. SI EL NPM INSTALL SE ATORA:
#    docker compose build --no-cache frontend
#    docker compose up frontend
#
# 4. VER LOGS DETALLADOS:
#    docker compose logs frontend -f
#
# 5. SI EL VOLUMEN NODE_MODULES SE CORROMPE:
#    docker compose down -v
#    docker compose up --build
#
# 6. VARIABLES DE ENTORNO (opcional):
#    NEXT_PUBLIC_API_URL: URL del backend
#    NODE_OPTIONS: "--max-old-space-size=4096" para más memoria
#
# ==========================================