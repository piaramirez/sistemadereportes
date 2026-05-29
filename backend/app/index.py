# ==========================================
# ARCHIVO: backend/api/index.py
# AUTOR: Pedro Antonio Ramírez Alcántara
# MATERIA: Vinculación Empresarial
# GRUPO: 2007 (2026-II)
# DOCENTE: Aarón Velasco Agustín
# CARRERA: Ingeniería en Computación - FES Aragón
# FUNCIÓN: Entry point para despliegue en Vercel Serverless
# ==========================================

# ==========================================
# IMPORTACIÓN DE LA APLICACIÓN PRINCIPAL
# ==========================================

# Importamos la instancia de FastAPI desde el archivo principal
# main.py contiene: app = FastAPI(), los routers, middlewares, etc.
from main import app

# ==========================================
# EXPORTACIÓN PARA VERCEL
# ==========================================

# Vercel Serverless Functions requiere que se exporte una variable
# llamada 'app' que contenga la aplicación FastAPI.
# 
# Esto permite que Vercel ejecute los endpoints como funciones
# serverless en la nube.
#
# La variable 'app' se expone directamente para que Vercel la detecte
# automáticamente al desplegar el proyecto.
app = app

# ==========================================
# NOTAS PARA EL DESPLIEGUE:
# ==========================================
#
# 1. Este archivo debe estar en: backend/api/index.py
#
# 2. La estructura de carpetas debe ser:
#    backend/
#    ├── api/
#    │   └── index.py   ← Este archivo
#    ├── main.py
#    ├── requirements.txt
#    ├── app/
#    │   ├── routers/
#    │   ├── database.py
#    │   └── utils/
#    └── prisma/
#        └── schema.prisma
#
# 3. Ver la configuración en vercel.json:
#    {
#      "builds": [
#        {
#          "src": "backend/api/index.py",
#          "use": "@vercel/python"
#        }
#      ],
#      "routes": [
#        {
#          "src": "/api/(.*)",
#          "dest": "backend/api/index.py"
#        }
#      ]
#    }
#
# 4. Variables de entorno necesarias en Vercel:
#    - DATABASE_URL: URL de PostgreSQL (Neon.tech o Supabase)
#    - SECRET_KEY: Clave secreta para JWT
#    - ALGORITHM: Algoritmo de encriptación (HS256)
#
# 5. Para probar localmente con Vercel CLI:
#    $ vercel dev
#
# 6. Para desplegar a producción:
#    $ vercel --prod
#
# ==========================================