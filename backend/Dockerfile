# ==========================================
# ARCHIVO: backend/Dockerfile
# AUTOR: Pedro Antonio Ramírez Alcántara
# MATERIA: Vinculación Empresarial
# GRUPO: 2007 (2026-II)
# DOCENTE: Aarón Velasco Agustín
# CARRERA: Ingeniería en Computación - FES Aragón
# FUNCIÓN: Contenedor Docker para el backend FastAPI con Prisma
# ==========================================

# ==========================================
# BASE DE LA IMAGEN
# ==========================================
# Usamos Python 3.11 slim (ligera) como imagen base
# Prisma requiere Python 3.8 o superior

FROM python:3.11-slim

# ==========================================
# METADATOS DEL AUTOR
# ==========================================

LABEL maintainer="Pedro Antonio Ramírez Alcántara"
LABEL institution="FES Aragón - UNAM"
LABEL project="EduInspect"
LABEL version="1.0.0"

# ==========================================
# CONFIGURACIÓN DEL DIRECTORIO DE TRABAJO
# ==========================================

WORKDIR /app

# ==========================================
# INSTALACIÓN DE DEPENDENCIAS DEL SISTEMA
# ==========================================
# Prisma necesita Node.js para generar el cliente
# También se necesita curl para descargar Node.js

RUN apt-get update && apt-get install -y \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# ==========================================
# INSTALACIÓN DE DEPENDENCIAS PYTHON
# ==========================================
# Primero copiamos solo requirements.txt para aprovechar caché de Docker
# Esto evita reinstalar dependencias si el código cambia

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# ==========================================
# COPIA DEL CÓDIGO FUENTE
# ==========================================
# Copiamos todo el código del backend al contenedor

COPY . .

# ==========================================
# GENERACIÓN DEL CLIENTE PRISMA
# ==========================================
# Prisma Client se genera en tiempo de construcción
# Esto asegura que el cliente esté disponible al ejecutar

RUN python -m prisma generate

# ==========================================
# VERIFICACIÓN DE ARCHIVOS (opcional - para debug)
# ==========================================
# RUN ls -la && ls -la prisma/

# ==========================================
# EXPOSICIÓN DEL PUERTO
# ==========================================
# FastAPI corre por defecto en el puerto 8000

EXPOSE 8000

# ==========================================
# COMANDO DE INICIO
# ==========================================
# Uvicorn es el servidor ASGI para ejecutar FastAPI
# --host 0.0.0.0 permite conexiones desde fuera del contenedor
# --port 8000 expone el puerto configurado

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

# ==========================================
# NOTAS PARA EL DESPLIEGUE:
# ==========================================
#
# 1. Construir la imagen:
#    docker build -t eduinspect-backend .
#
# 2. Ejecutar el contenedor:
#    docker run -p 8000:8000 --env-file .env eduinspect-backend
#
# 3. Con docker-compose (recomendado):
#    docker-compose up backend
#
# 4. Variable de entorno DATABASE_URL debe estar disponible
#    en el contenedor (por .env o docker-compose.yml)
#
# 5. Para conectar con PostgreSQL en otro contenedor:
#    Usar el nombre del servicio como host: postgres:5432
#
# ==========================================