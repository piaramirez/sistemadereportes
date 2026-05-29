# 🏫 Sistema de Gestión de Incidencias e Inspecciones - EduInspect

**FES Aragón - UNAM** | Ingeniería en Computación | Vinculación Empresarial

Sistema integral para la gestión de reportes de incidencias e inspecciones en instalaciones educativas. Permite registrar, asignar, dar seguimiento y generar reportes de mantenimiento con un flujo completo de trabajo.

## 🎯 Objetivo

Digitalizar el proceso de reporte de incidencias, optimizando los tiempos de respuesta y mejorando la trazabilidad de las tareas de mantenimiento.

---

## 🖥️ Requisitos Previos (Para todos los sistemas)

- **Docker Desktop** (versión 4.20 o superior)
- **Git** (opcional, para clonar)

> ⚠️ **IMPORTANTE**: Docker Desktop debe estar **corriendo** y con los recursos suficientes (mínimo 4GB de RAM asignados).

---

## 🚀 Instalación (Clonar y ejecutar)

Sigue estos 3 pasos sin importar tu sistema operativo:

### 1️⃣ Clonar el repositorio

Abre tu terminal (PowerShell, CMD, Bash) y ejecuta:

```bash
git clone https://github.com/piaramirez/sistemadereportes.git
cd sistemadereportes
```

### 2️⃣ Ejecutar el instalador automático

El instalador detecta tu SO y hace todo el trabajo.

#### En **Windows**:
```powershell
# Click derecho en install.bat -> "Ejecutar como administrador"
install.bat
```

#### En **macOS / Linux**:
```bash
# Da permisos de ejecución y corre el script
chmod +x install.sh
./install.sh
```

### 3️⃣ Esperar (3 a 5 minutos)

El instalador:
- ✅ Verifica Docker
- ✅ Crea el archivo `.env`
- ✅ Limpia contenedores e imágenes viejas
- ✅ Construye los contenedores del **backend** (FastAPI) y **frontend** (Next.js)
- ✅ Levanta los servicios
- ✅ Activa los usuarios en la base de datos

---

## 🔑 Accesos al Sistema

| Rol | Correo Electrónico | Contraseña |
|-----|-------------------|-------------|
| 👑 **Administrador** (Global) | `admin@edusync.com` | `admin123` |
| 📋 **Coordinador** (Encargado) | `coordinador@edusync.com` | `Unam26!#` |
| 🔧 **Técnico** (Mantenimiento) | `tecnico@edusync.com` | `Unam26!#` |
| 🔍 **Inspector** (Levanta reportes) | `inspector@edusync.com` | `Unam26!#` |

---

## 🌐 URLs de Acceso

| Servicio | URL | Descripción |
|----------|-----|-------------|
| 🖥️ **Frontend** | [http://localhost:3000](http://localhost:3000) | Interfaz de usuario (Next.js) |
| 📡 **Backend API** | [http://localhost:8000/docs](http://localhost:8000/docs) | Documentación interactiva (FastAPI) |
| 🗄️ **Base de Datos** | `localhost:5433` | PostgreSQL (usuario: `postgres` / pass: `postgres`) |

---

## 🛠️ Comandos Útiles (Funcionan en todos los SO)

### Gestión de Contenedores

```bash
# Levantar todos los servicios
docker compose up -d

# Ver logs en tiempo real
docker compose logs -f

# Ver logs específicos
docker compose logs frontend -f
docker compose logs backend -f

# Detener todo
docker compose down

# Reconstruir desde cero (si algo falla)
docker compose down -v
docker compose up -d --build

# Ver contenedores activos
docker ps
```

### Base de Datos (PostgreSQL)

```bash
# Entrar a la terminal de PostgreSQL
docker exec -it edusync_postgres psql -U postgres -d edusync

# Ver todas las tablas
docker exec -it edusync_postgres psql -U postgres -d edusync -c "\dt"

# Ver usuarios
docker exec -it edusync_postgres psql -U postgres -d edusync -c "SELECT * FROM users;"

# Ver reportes
docker exec -it edusync_postgres psql -U postgres -d edusync -c "SELECT * FROM reports;"

# Activar todos los usuarios
docker exec edusync_postgres psql -U postgres -d edusync -c "UPDATE users SET is_active = true;"
```

### Prisma (Backend)

```bash
# Generar el cliente de Prisma (si cambia el schema)
docker compose exec backend prisma generate

# Sincronizar el esquema con la BD (sin migraciones)
docker compose exec backend prisma db push
```

---

## ⚠️ Solución de Problemas Comunes

| Problema | Posible Solución |
|----------|------------------|
| **"Docker no está corriendo"** | Inicia Docker Desktop desde el menú y espera el ícono verde. |
| **Error de puertos (3000, 8000, 5433)** | Cierra las aplicaciones que usan esos puertos o cámbialos en `docker-compose.yml`. |
| **El frontend no carga estilos** | `docker compose restart frontend` y presiona `Ctrl + Shift + R` en el navegador. |
| **`npm install` lento o falla** | Reconstruye solo el frontend: `docker compose build --no-cache frontend`. |
| **Error de JSON en `package.json`** | Ábrelo con VSCode y guárdalo con encoding `UTF-8` (sin BOM). |

---

## 📁 Estructura del Proyecto

```
sistemadereportes/
├── frontend/               # Aplicación Next.js
│   ├── app/                # App Router (login, dashboard, reports, admin)
│   ├── components/         # Componentes reutilizables
│   ├── lib/                # Utilidades y configuraciones
│   ├── package.json
│   ├── next.config.js
│   └── Dockerfile
├── backend/                # API con FastAPI
│   ├── app/
│   │   ├── main.py
│   │   ├── routers/        # Endpoints (auth, reports, assignments, export...)
│   │   ├── models/         # Modelos de Prisma
│   │   ├── schemas/        # Esquemas Pydantic
│   │   ├── services/       # Lógica de negocio (email, pdf, reportes)
│   │   └── utils/
│   ├── prisma/
│   │   └── schema.prisma   # Esquema de base de datos
│   ├── requirements.txt
│   └── Dockerfile
├── database/               # Scripts SQL (schema, seed)
├── docs/                   # Documentación académica (PDFs, diagramas)
├── docker-compose.yml      # Orquestación de contenedores
├── .env.example            # Variables de entorno de ejemplo
├── .gitignore
├── README.md
├── install.bat             # Instalador para Windows
└── install.sh              # Instalador para macOS/Linux
```

---

## 🔧 Desarrollo Local (Sin Docker)

Si prefieres ejecutar los servicios directamente:

### Backend (FastAPI)

```bash
cd backend
python -m venv venv
source venv/bin/activate      # En Windows: `venv\Scripts\activate`
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

---

## 📄 Licencia

Proyecto académico - **FES Aragón UNAM**

---

## 👨‍💻 Autor

**Pedro Antonio Ramírez Alcántara**  
Ingeniería en Computación - Grupo 2007 (2026-II)

---

**© 2026 - FES Aragón UNAM**
```


