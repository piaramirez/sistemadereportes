# ==========================================
# ARCHIVO: backend/Dockerfile
# AUTOR: Pedro Antonio Ramírez Alcántara
# ==========================================

FROM python:3.11-slim

WORKDIR /app

# Instalar dependencias del sistema y Node.js (para Prisma)
RUN apt-get update && apt-get install -y \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Copiar e instalar dependencias Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el resto del código
COPY . .

# Instalar Prisma CLI globalmente
RUN npm install -g prisma

# Generar el cliente Prisma (esto crea prisma-client-py)
RUN prisma generate

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]