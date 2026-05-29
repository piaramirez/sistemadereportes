FROM python:3.11-slim

WORKDIR /app

# 1. Instalar Node.js (Requisito obligatorio para el motor de Prisma)
RUN apt-get update && apt-get install -y \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# 2. Copiar e instalar dependencias (Ahora sí incluirá Prisma de Python)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 3. Copiar el código del proyecto
COPY . .

# 4. Generar el cliente usando el módulo de Python
RUN python -m prisma generate

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]