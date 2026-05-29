# ==========================================
# ARCHIVO: frontend/Dockerfile
# AUTOR: Pedro Antonio Ramírez Alcántara
# MATERIA: Vinculación Empresarial
# GRUPO: 2007 (2026-II)
# DOCENTE: Aarón Velasco Agustín
# CARRERA: Ingeniería en Computación - FES Aragón
# FUNCIÓN: Contenedor Docker para el frontend Next.js
# ==========================================

# ==========================================
# BASE DE LA IMAGEN
# ==========================================
# Usamos Alpine Linux por su tamaño reducido (más ligero)
# Node.js 20 es LTS (Long Term Support) estable

FROM node:20-alpine

# ==========================================
# METADATOS DEL AUTOR
# ==========================================

LABEL maintainer="Pedro Antonio Ramírez Alcántara"
LABEL institution="FES Aragón - UNAM"
LABEL project="EduInspect"
LABEL component="frontend"
LABEL version="1.0.0"

# ==========================================
# CONFIGURACIÓN DEL DIRECTORIO DE TRABAJO
# ==========================================

WORKDIR /app

# ==========================================
# INSTALACIÓN DE DEPENDENCIAS
# ==========================================
# Copiamos solo package.json y package-lock.json primero
# Esto aprovecha la caché de Docker: si no cambian las dependencias,
# no se reinstalan en cada build

COPY package*.json ./

# Instalar dependencias
# --legacy-peer-deps: resuelve conflictos de peer dependencies
# --no-cache: no guarda caché local para reducir tamaño
RUN npm install --legacy-peer-deps

# ==========================================
# COPIA DEL CÓDIGO FUENTE
# ==========================================
# Copiamos el resto del código al contenedor

COPY . .

# ==========================================
# CONSTRUCCIÓN DE LA APLICACIÓN (PRODUCCIÓN)
# ==========================================
# Descomentar estas líneas para producción
# RUN npm run build

# ==========================================
# EXPOSICIÓN DEL PUERTO
# ==========================================
# Next.js por defecto usa el puerto 3000

EXPOSE 3000

# ==========================================
# COMANDO DE INICIO
# ==========================================
# npm run dev: modo desarrollo con hot reload
# Para producción, cambiar a: CMD ["npm", "start"]

CMD ["npm", "run", "dev"]

# ==========================================
# VARIANTES DE COMANDOS SEGÚN ENTORNO:
# ==========================================
#
# DESARROLLO (hot reload):
# CMD ["npm", "run", "dev"]
#
# PRODUCCIÓN:
# CMD ["npm", "start"]
#
# CON VARIABLES DE ENTORNO:
# CMD ["sh", "-c", "NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL npm run start"]
#

# ==========================================
# NOTAS PARA EL DESPLIEGUE:
# ==========================================
#
# 1. CONSTRUIR LA IMAGEN:
#    docker build -t eduinspect-frontend -f frontend/Dockerfile ./frontend
#
# 2. EJECUTAR EL CONTENEDOR:
#    docker run -p 3000:3000 --env-file .env eduinspect-frontend
#
# 3. CON DOCKER COMPOSE (recomendado):
#    docker-compose up frontend
#
# 4. VARIABLES DE ENTORNO NECESARIAS:
#    - NEXT_PUBLIC_API_URL: URL del backend
#    - Ejemplo: http://backend:8000 (dentro de Docker)
#    - Ejemplo: http://localhost:8000 (desde host)
#
# 5. PARA PRODUCCIÓN (build estático):
#    Descomentar RUN npm run build
#    Cambiar CMD a ["npm", "start"]
#    Considerar usar standalone: next build standalone
#
# ==========================================