# Sistema de Gestión de Incidencias e Inspecciones

## Descripción del Proyecto

Sistema integral para la gestión de reportes de incidencias e inspecciones en instalaciones educativas. Permite registrar, asignar, dar seguimiento y generar reportes de mantenimiento con un flujo completo de trabajo.

## Objetivo

Digitalizar el proceso de reporte de incidencias, optimizando los tiempos de respuesta y mejorando la trazabilidad de las tareas de mantenimiento en instituciones educativas.

## Estructura del Proyecto

sistemadereportes/
│
├── frontend/ # Aplicación Next.js
│ ├── app/ # App Router de Next.js
│ │ ├── login/ # Página de autenticación
│ │ ├── dashboard/ # Panel de control principal
│ │ ├── reports/ # Gestión de reportes
│ │ │ ├── new/ # Crear nuevo reporte
│ │ │ ├── [id]/ # Detalle de reporte
│ │ │ └── export/ # Exportación de datos
│ │ └── admin/ # Administración (usuarios, ubicaciones)
│ ├── components/ # Componentes reutilizables
│ ├── lib/ # Utilidades y configuraciones
│ ├── package.json
│ └── next.config.js
│
├── backend/ # API con FastAPI
│ ├── app/
│ │ ├── main.py # Punto de entrada
│ │ ├── routers/ # Endpoints organizados
│ │ │ ├── auth.py # Autenticación (login/register)
│ │ │ ├── reports.py # CRUD de reportes
│ │ │ ├── assignments.py # Asignaciones
│ │ │ ├── notifications.py # Notificaciones
│ │ │ └── export.py # Exportación PDF/Excel
│ │ ├── models/ # Modelos de Prisma
│ │ ├── schemas/ # Esquemas Pydantic
│ │ ├── services/ # Lógica de negocio
│ │ │ ├── email_service.py
│ │ │ ├── pdf_generator.py
│ │ │ └── report_service.py
│ │ └── utils/ # Funciones auxiliares
│ ├── prisma/
│ │ └── schema.prisma # Esquema de base de datos
│ ├── requirements.txt
│ └── Dockerfile
│
├── database/ # Scripts de base de datos
│ ├── schema.sql # Creación de tablas
│ └── seed.sql # Datos de prueba
│
├── docs/ # Documentación académica
│ ├── Entregable_Integral_Proyecto.pdf
│ └── diagramas/
│
├── docker-compose.yml # Orquestación de contenedores
├── .env.example # Variables de entorno (ejemplo)
├── .gitignore
└── README.md

# Database

DATABASE_URL="postgresql://user:password@localhost:5432/edusync"

# JWT

SECRET_KEY="tu-secret-key"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Email (SendGrid/Resend)

EMAIL_API_KEY="tu-api-key"
EMAIL_FROM="noreply@edusync.com"

# Los comandos serían:

docker compose up -d
docker compose down
docker compose logs

# Usar el nombre correcto del contenedor

docker exec -i sistemsync_postgres psql -U postgres -d edusync < schema.sql

# Ver tablas

docker exec -it sistemsync_postgres psql -U postgres -d edusync -c "\dt"

# Ver usuarios

docker exec -it sistemsync_postgres psql -U postgres -d edusync -c "SELECT \* FROM users;"

# Ver reportes

docker exec -it sistemsync_postgres psql -U postgres -d edusync -c "SELECT \* FROM reports;"

# Entrar a PostgreSQL

docker exec -it sistemsync_postgres psql -U postgres -d edusync

cd ~/Documentos/sistemadereportes/backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
cd ~/Documentos/sistemadereportes/frontend
npm run dev

admin@edusync.com / admin123

inspector@edusync.com / admin123

tecnico@edusync.com / admin123

docker compose logs backend -f

docker compose up -d postgres
