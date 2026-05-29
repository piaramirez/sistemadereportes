# ==========================================
# ARCHIVO: main.py
# AUTOR: Pedro Antonio Ramírez Alcántara
# MATERIA: Vinculación Empresarial
# GRUPO: 2007 (2026-II)
# DOCENTE: Aarón Velasco Agustín
# CARRERA: Ingeniería en Computación - FES Aragón
# FUNCIÓN: Backend principal de EduInspect - API REST para gestión de reportes
# ==========================================

# ==========================================
# IMPORTACIONES ESTÁNDAR Y DE TERCEROS
# ==========================================

from fastapi import FastAPI, Depends, HTTPException, status, File, Form, UploadFile, Header
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
from typing import Optional, List
import os
import uuid
from prisma import Prisma
from dotenv import load_dotenv

# Cargar variables de entorno desde archivo .env
load_dotenv()

# ==========================================
# INICIALIZACIÓN DE LA APLICACIÓN FASTAPI
# ==========================================

app = FastAPI(
    title="EduInspect API",
    version="1.0.0",
    description="API para gestión de reportes de incidencias - FES Aragón UNAM",
    docs_url="/api/docs",      # Documentación Swagger UI
    redoc_url="/api/redoc"     # Documentación ReDoc
)

# ==========================================
# CONFIGURACIÓN CORS (Cross-Origin Resource Sharing)
# ==========================================
# Permite que el frontend (Next.js) se comunique con el backend
# En producción, cambiar por el dominio real de Vercel

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",      # Desarrollo local Next.js
        "https://*.vercel.app",        # Producción Vercel
        "http://localhost:8000"       # Desarrollo local backend
    ],
    allow_credentials=True,
    allow_methods=["*"],              # Permitir todos los métodos (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],              # Permitir todos los headers
)

# ==========================================
# CONFIGURACIÓN DE ARCHIVOS ESTÁTICOS
# ==========================================

# Crear carpeta static si no existe (para imágenes subidas)
if not os.path.exists("static"):
    os.makedirs("static")

# Montar directorio estático para servir imágenes
app.mount("/static", StaticFiles(directory="static"), name="static")

# ==========================================
# CONFIGURACIÓN DE SEGURIDAD Y AUTENTICACIÓN
# ==========================================

# Claves y configuración JWT
SECRET_KEY = os.getenv("SECRET_KEY", "tu-secret-key")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
try:
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))
except ValueError:
    ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Contexto para hashear contraseñas con bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Esquema OAuth2 para obtener el token del header Authorization: Bearer <token>
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# ==========================================
# CLIENTE DE BASE DE DATOS (PRISMA)
# ==========================================

db = Prisma()

# ==========================================
# EVENTOS DE CICLO DE VIDA
# ==========================================

@app.on_event("startup")
async def startup():
    """Conectar a la base de datos al iniciar el servidor"""
    await db.connect()
    print("✅ Conectado a PostgreSQL")

@app.on_event("shutdown")
async def shutdown():
    """Desconectar de la base de datos al cerrar el servidor"""
    await db.disconnect()
    print("👋 Desconectado de PostgreSQL")

# ==========================================
# MODELOS PYDANTIC (Validación de datos)
# ==========================================

class LoginRequest(BaseModel):
    """Modelo para solicitud de login"""
    email: EmailStr
    password: str

class Token(BaseModel):
    """Modelo para respuesta de autenticación"""
    access_token: str
    token_type: str
    user: dict

class StatusUpdateRequest(BaseModel):
    """Modelo para actualizar estado de un reporte"""
    status: str

class CommentCreateRequest(BaseModel):
    """Modelo para crear un comentario en un reporte"""
    comment: str

# ==========================================
# FUNCIONES AUXILIARES
# ==========================================

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verificar si la contraseña plana coincide con el hash almacenado"""
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    """Crear un token JWT con fecha de expiración"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# ==========================================
# ENDPOINTS PRINCIPALES
# ==========================================

@app.get("/")
def root():
    """Endpoint de verificación de salud del API"""
    return {
        "message": "EduInspect API",
        "status": "running",
        "version": "1.0.0",
        "author": "Pedro Antonio Ramírez Alcántara",
        "institution": "FES Aragón - UNAM"
    }

# ==========================================
# AUTENTICACIÓN
# ==========================================

@app.post("/api/auth/login", response_model=Token)
async def login(login_data: LoginRequest):
    """
    Autentica un usuario y devuelve un token JWT.
    
    Credenciales por defecto:
    - admin: pia@edusync.com / admin123
    - técnico: tecnico@edusync.com / Unam26!#
    """
    user = await db.user.find_unique(where={"email": login_data.email})
    
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos"
        )
    
    access_token = create_access_token(data={
        "sub": user.email,
        "role": user.role
    })
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    }

# ==========================================
# USUARIOS (CRUD BÁSICO)
# ==========================================

@app.get("/api/users")
async def get_all_users():
    """Obtener lista de todos los usuarios (sin autenticación para desarrollo)"""
    try:
        users = await db.user.find_many(order={"name": "asc"})
        return [
            {
                "id": str(u.id),
                "name": str(u.name),
                "role": str(u.role)
            }
            for u in users
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==========================================
# ESTADÍSTICAS DEL DASHBOARD
# ==========================================

@app.get("/api/dashboard/stats")
async def get_stats():
    """Obtener estadísticas para el panel de control principal"""
    try:
        total = await db.report.count()
        pending = await db.report.count(where={"status": "pending"})
        completed = await db.report.count(where={"status": "completed"})
        
        return {
            "total_reports": total,
            "pending": pending,
            "completed_last_7_days": completed
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==========================================
# REPORTES (CRUD COMPLETO)
# ==========================================

@app.get("/api/reports")
async def get_reports():
    """Obtener lista de reportes con ubicación y edificio"""
    try:
        reports = await db.report.find_many(
            take=20,
            order={"created_at": "desc"},
            include={
                "location": {
                    "include": {"building": True}
                }
            }
        )
        
        return [
            {
                "id": int(r.id),
                "report_number": str(r.report_number),
                "location": str(r.location.name) if r.location else "Sin ubicación",
                "building": str(r.location.building.name) if r.location and r.location.building else "FES Aragón",
                "status": str(r.status),
                "date": r.report_date.strftime("%Y-%m-%d") if r.report_date else "S/F"
            }
            for r in reports
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/reports/{report_id}")
async def get_report_detail(report_id: int):
    """Obtener detalle completo de un reporte específico"""
    try:
        # Buscar reporte con relaciones
        r = await db.report.find_unique(
            where={"id": int(report_id)},
            include={
                "location": {"include": {"building": True}},
                "reporter": True
            }
        )
        
        if not r:
            raise HTTPException(status_code=404, detail="El reporte solicitado no existe")
        
        # Obtener asignación
        assignment = await db.assignment.find_first(
            where={"report_id": int(report_id)},
            include={"technician": True}
        )
        
        technician_name = str(assignment.technician.name) if assignment and assignment.technician else "Sin técnico asignado"
        assigned_to_id = str(assignment.technician_id) if assignment else "unassigned"
        
        # Obtener imágenes
        report_images = await db.image.find_many(where={"report_id": int(report_id)})
        
        # Obtener evaluaciones (calificaciones de estrellas)
        floor_eval = await db.evaluation.find_first(
            where={"report_id": int(report_id), "criteria_name": "Limpieza del Suelo"}
        )
        light_eval = await db.evaluation.find_first(
            where={"report_id": int(report_id), "criteria_name": "Funcionalidad de Iluminación"}
        )
        
        # Obtener comentarios del historial
        history_logs = await db.reporthistory.find_many(
            where={"report_id": int(report_id), "action": "comment"},
            include={"user": True},
            order={"created_at": "asc"}
        )
        
        comments_list = [
            {
                "id": h.id,
                "user_name": h.user.name if h.user else "Usuario UNAM",
                "user_role": h.user.role if h.user else "user",
                "comment": h.new_value,
                "created_at": h.created_at.strftime("%Y-%m-%d %H:%M")
            }
            for h in history_logs
        ]
        
        return {
            "id": str(r.id),
            "report_number": str(r.report_number),
            "reporter_name": str(r.reporter.name) if r.reporter else "Inspector UNAM",
            "date": r.report_date.strftime("%Y-%m-%d") if r.report_date else "",
            "date_formatted": r.report_date.strftime("%d de %B, %Y") if r.report_date else "Sin fecha",
            "location_type": str(r.location.location_type) if r.location else "classroom",
            "location": str(r.location.name) if r.location else "Ubicación General",
            "building": str(r.location.building.name) if r.location and r.location.building else "FES Aragón",
            "status": str(r.status),
            "comments": str(r.comments) or "",
            "assigned_technician": technician_name,
            "assigned_to_id": assigned_to_id,
            "floor_cleaning_rating": floor_eval.rating if floor_eval else 5,
            "lighting_rating": light_eval.rating if light_eval else 5,
            "images": [{"url": str(img.url), "caption": str(img.caption)} for img in report_images],
            "chat_comments": comments_list
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/reports/{report_id}/comments")
async def add_report_comment(report_id: int, payload: CommentCreateRequest, token: str = Depends(oauth2_scheme)):
    """
    Agregar un comentario a un reporte.
    El comentario se guarda en report_history y se notifica al técnico/reportero.
    """
    try:
        # Decodificar token para obtener usuario actual
        user_data = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        current_user = await db.user.find_unique(where={"email": user_data.get("sub")})
        
        if not current_user:
            raise HTTPException(status_code=404, detail="Usuario no autenticado")
        
        # Verificar que el reporte existe
        report_exists = await db.report.find_unique(where={"id": int(report_id)})
        if not report_exists:
            raise HTTPException(status_code=404, detail="El reporte no existe")
        
        # Guardar comentario en historial
        new_comment_log = await db.reporthistory.create(
            data={
                "report": {"connect": {"id": int(report_id)}},
                "user": {"connect": {"id": current_user.id}},
                "action": "comment",
                "old_value": "chat_interaction",
                "new_value": payload.comment
            }
        )
        
        # Determinar a quién notificar
        assignment = await db.assignment.find_first(where={"report_id": int(report_id)})
        target_user_id = None
        notify_message = f"Nuevo comentario de {current_user.name} en el reporte {report_exists.report_number}"
        
        if assignment:
            if str(current_user.id) == str(assignment.technician_id):
                target_user_id = report_exists.reporter_id
            else:
                target_user_id = assignment.technician_id
        else:
            if str(current_user.id) != str(report_exists.reporter_id):
                target_user_id = report_exists.reporter_id
        
        # Crear notificación
        if target_user_id:
            await db.notification.create(
                data={
                    "user": {"connect": {"id": target_user_id}},
                    "report": {"connect": {"id": int(report_id)}},
                    "type": "comment",
                    "message": notify_message,
                    "is_read": False
                }
            )
        
        return {"status": "success", "message": "Comentario guardado y usuario notificado."}
        
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/reports/{report_id}/status")
async def update_report_status(report_id: int, payload: StatusUpdateRequest, token: str = Depends(oauth2_scheme)):
    """
    Actualizar el estado de un reporte.
    Solo accesible para admin y coordinator.
    """
    try:
        # Verificar rol del usuario
        user_data = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_role = str(user_data.get("role", "")).lower()
        
        if user_role not in ["admin", "coordinator"]:
            raise HTTPException(status_code=403, detail="No tienes permisos para actualizar estados.")
        
        # Verificar que el reporte existe
        report_exists = await db.report.find_unique(where={"id": int(report_id)})
        if not report_exists:
            raise HTTPException(status_code=404, detail="Reporte no encontrado")
        
        # Actualizar estado
        await db.report.update(
            where={"id": int(report_id)},
            data={"status": payload.status}
        )
        
        # Registrar en historial
        current_user = await db.user.find_unique(where={"email": user_data.get("sub")})
        if current_user:
            await db.reporthistory.create(
                data={
                    "report": {"connect": {"id": int(report_id)}},
                    "user": {"connect": {"id": current_user.id}},
                    "action": "status_change",
                    "old_value": report_exists.status or "pending",
                    "new_value": payload.status
                }
            )
            
            # Notificar al reportero
            if report_exists.reporter_id and str(current_user.id) != str(report_exists.reporter_id):
                await db.notification.create(
                    data={
                        "user": {"connect": {"id": report_exists.reporter_id}},
                        "report": {"connect": {"id": int(report_id)}},
                        "type": "status_change",
                        "message": f"El estado del reporte {report_exists.report_number} cambió a: {payload.status}",
                        "is_read": False
                    }
                )
        
        return {"status": "success", "new_status": str(payload.status)}
        
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.patch("/api/reports/{report_id}")
async def patch_report_detail(
    report_id: int,
    building_name: Optional[str] = Form(None),
    classroom_name: Optional[str] = Form(None),
    location_type: Optional[str] = Form(None),
    floor_cleaning: Optional[str] = Form(None),
    lighting_status: Optional[str] = Form(None),
    comments: Optional[str] = Form(None),
    assigned_to_id: Optional[str] = Form(None),
    delete_photo: Optional[str] = Form("false"),
    file: Optional[UploadFile] = File(None),
    token: str = Depends(oauth2_scheme)
):
    """
    Actualización parcial de un reporte.
    Permite modificar ubicación, evaluaciones, asignación y fotos.
    """
    try:
        # Verificar autenticación y permisos
        user_data = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        current_user = await db.user.find_unique(where={"email": user_data.get("sub")})
        
        if not current_user or str(current_user.role).lower() not in ["admin", "coordinator"]:
            raise HTTPException(status_code=403, detail="No tienes autorización para editar reportes.")
        
        # Verificar que el reporte existe
        report_exists = await db.report.find_unique(
            where={"id": int(report_id)},
            include={"location": True}
        )
        if not report_exists:
            raise HTTPException(status_code=404, detail="El reporte especificado no existe.")
        
        # 1. Actualizar ubicación
        location_id = report_exists.location_id
        if building_name and classroom_name:
            building = await db.building.find_first(where={"name": building_name})
            if not building:
                building = await db.building.create(data={"name": building_name})
            
            location = await db.location.find_first(
                where={"name": classroom_name, "building_id": building.id}
            )
            if not location:
                location = await db.location.create(
                    data={
                        "name": classroom_name,
                        "location_type": location_type or "classroom",
                        "building_id": building.id
                    }
                )
            location_id = location.id
        
        # Actualizar reporte
        await db.report.update(
            where={"id": int(report_id)},
            data={
                "comments": comments if comments is not None else report_exists.comments,
                "location_id": location_id
            }
        )
        
        # 2. Actualizar evaluaciones
        if floor_cleaning:
            await db.evaluation.delete_many(
                where={"report_id": int(report_id), "criteria_name": "Limpieza del Suelo"}
            )
            await db.evaluation.create(
                data={
                    "report_id": int(report_id),
                    "criteria_name": "Limpieza del Suelo",
                    "rating": int(floor_cleaning)
                }
            )
        
        if lighting_status:
            await db.evaluation.delete_many(
                where={"report_id": int(report_id), "criteria_name": "Funcionalidad de Iluminación"}
            )
            await db.evaluation.create(
                data={
                    "report_id": int(report_id),
                    "criteria_name": "Funcionalidad de Iluminación",
                    "rating": int(lighting_status)
                }
            )
        
        # 3. Reasignar técnico
        if assigned_to_id:
            if assigned_to_id == "unassigned":
                await db.assignment.delete_many(where={"report_id": int(report_id)})
            else:
                tech_uuid = str(uuid.UUID(assigned_to_id))
                existing_assign = await db.assignment.find_first(where={"report_id": int(report_id)})
                
                if existing_assign:
                    await db.assignment.update(
                        where={"id": existing_assign.id},
                        data={"technician_id": tech_uuid, "status": "assigned"}
                    )
                else:
                    await db.assignment.create(
                        data={
                            "report_id": int(report_id),
                            "technician_id": tech_uuid,
                            "assigner_id": current_user.id,
                            "status": "assigned"
                        }
                    )
        
        # 4. Gestionar imágenes
        if delete_photo == "true":
            await db.image.delete_many(where={"report_id": int(report_id)})
        
        if file:
            upload_dir = "static/uploads"
            os.makedirs(upload_dir, exist_ok=True)
            file_name = f"{int(datetime.utcnow().timestamp())}_{file.filename}"
            file_path = os.path.join(upload_dir, file_name)
            
            with open(file_path, "wb") as buffer:
                buffer.write(await file.read())
            
            await db.image.create(
                data={
                    "report_id": int(report_id),
                    "url": f"http://localhost:8000/static/uploads/{file_name}",
                    "caption": "Evidencia modificada en auditoría."
                }
            )
        
        # 5. Registrar en historial
        await db.reporthistory.create(
            data={
                "report_id": int(report_id),
                "user_id": current_user.id,
                "action": "edit",
                "old_value": "datos_previos",
                "new_value": "Formulario estructurado modificado integralmente."
            }
        )
        
        return {"status": "success", "message": "Datos modificados exitosamente."}
        
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/reports/{report_id}")
async def delete_report(report_id: int, token: str = Depends(oauth2_scheme)):
    """
    Eliminar un reporte.
    SOLO accesible para administradores.
    NO permite eliminar reportes con estado 'completed'.
    """
    try:
        # Verificar rol de administrador
        user_data = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_role = str(user_data.get("role", "")).lower()
        
        if user_role != "admin":
            raise HTTPException(status_code=403, detail="Únicamente administradores pueden eliminar reportes.")
        
        # Verificar que el reporte existe
        report_exists = await db.report.find_unique(where={"id": int(report_id)})
        if not report_exists:
            raise HTTPException(status_code=404, detail="El reporte no existe.")
        
        # Regla de seguridad: no eliminar reportes completados
        if str(report_exists.status).lower() == "completed":
            raise HTTPException(
                status_code=400,
                detail="Operación rechazada: No se permite eliminar incidencias con estado 'Completado'."
            )
        
        # Eliminar reporte (las relaciones en cascada se encargan del resto)
        await db.report.delete(where={"id": int(report_id)})
        
        return {"status": "success", "message": "Registro eliminado permanentemente."}
        
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/reports")
async def create_report(
    location_type: str = Form(...),
    building_name: str = Form(...),
    classroom_name: str = Form(...),
    comments: str = Form(...),
    floor_cleaning: str = Form(...),
    lighting_status: str = Form(...),
    assigned_to_id: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    authorization: Optional[str] = Header(None),
    token: str = Depends(oauth2_scheme)
):
    """
    Crear un nuevo reporte de incidencia.
    Solo accesible para admin y coordinator.
    """
    try:
        # Obtener token (prioridad al header Authorization)
        jwt_token = token
        if authorization and authorization.startswith("Bearer "):
            jwt_token = authorization.split(" ")[1]
        
        # Decodificar token
        try:
            user_data = jwt.decode(jwt_token, SECRET_KEY, algorithms=[ALGORITHM])
        except JWTError:
            raise HTTPException(status_code=401, detail="Sesión expirada o token inválido")
        
        # Obtener usuario reportero
        reporter_user = await db.user.find_unique(where={"email": user_data.get("sub")})
        if not reporter_user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        # Verificar rol
        user_role = str(reporter_user.role).lower()
        if user_role not in ["admin", "coordinator"]:
            raise HTTPException(status_code=403, detail="No tienes autorización para crear reportes.")
        
        # Crear o obtener edificio
        building = await db.building.find_first(where={"name": building_name})
        if not building:
            building = await db.building.create(data={"name": building_name})
        
        # Crear o obtener ubicación
        location = await db.location.find_first(
            where={"name": classroom_name, "building_id": building.id}
        )
        if not location:
            location = await db.location.create(
                data={
                    "name": classroom_name,
                    "location_type": location_type,
                    "building_id": building.id
                }
            )
        
        # Generar número de reporte (R-XXXXX)
        last_report = await db.report.find_first(order={"id": "desc"})
        next_id = (last_report.id + 1) if last_report else 1
        generated_number = f"R-{str(next_id).zfill(5)}"
        now_dt = datetime.utcnow()
        
        # Crear reporte
        new_report = await db.report.create(
            data={
                "report_number": generated_number,
                "reporter": {"connect": {"id": reporter_user.id}},
                "location": {"connect": {"id": location.id}},
                "report_date": now_dt,
                "inspection_date": now_dt,
                "comments": comments,
                "status": "pending" if (not assigned_to_id or assigned_to_id == "unassigned") else "assigned"
            }
        )
        
        # Crear evaluaciones
        await db.evaluation.create(
            data={
                "report": {"connect": {"id": new_report.id}},
                "criteria_name": "Limpieza del Suelo",
                "rating": 5 if floor_cleaning == "bueno" else 1
            }
        )
        await db.evaluation.create(
            data={
                "report": {"connect": {"id": new_report.id}},
                "criteria_name": "Funcionalidad de Iluminación",
                "rating": 5 if lighting_status == "bueno" else 1
            }
        )
        
        # Asignar técnico (opcional)
        if assigned_to_id and assigned_to_id != "unassigned":
            try:
                tech_uuid = str(uuid.UUID(assigned_to_id))
                await db.assignment.create(
                    data={
                        "report": {"connect": {"id": new_report.id}},
                        "technician": {"connect": {"id": tech_uuid}},
                        "assigner": {"connect": {"id": reporter_user.id}},
                        "status": "assigned"
                    }
                )
                
                # Notificar al técnico
                await db.notification.create(
                    data={
                        "user": {"connect": {"id": tech_uuid}},
                        "report": {"connect": {"id": new_report.id}},
                        "type": "assignment",
                        "message": f"Se te ha asignado un nuevo reporte de mantenimiento: {generated_number}",
                        "is_read": False
                    }
                )
            except Exception as err_assign:
                print(f"Error en asignación: {err_assign}")
        
        # Guardar imagen (opcional)
        if file:
            try:
                upload_dir = "static/uploads"
                os.makedirs(upload_dir, exist_ok=True)
                file_name = f"{int(datetime.utcnow().timestamp())}_{file.filename}"
                file_path = os.path.join(upload_dir, file_name)
                
                with open(file_path, "wb") as buffer:
                    buffer.write(await file.read())
                
                await db.image.create(
                    data={
                        "report": {"connect": {"id": new_report.id}},
                        "url": f"http://localhost:8000/static/uploads/{file_name}",
                        "caption": "Evidencia inicial."
                    }
                )
            except Exception as err_img:
                print(f"Error al guardar imagen: {err_img}")
        
        # Registrar en historial
        await db.reporthistory.create(
            data={
                "report": {"connect": {"id": new_report.id}},
                "user": {"connect": {"id": reporter_user.id}},
                "action": "creation",
                "new_value": f"Reporte {generated_number} creado con éxito."
            }
        )
        
        return {"status": "success", "report_number": str(generated_number)}
        
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR CRÍTICO: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")


# ==========================================
# MÓDULO GESTIÓN DE PERSONAL
# ==========================================

@app.get("/api/users")
async def get_all_users(token: str = Depends(oauth2_scheme)):
    """Obtener todos los usuarios del sistema"""
    try:
        users = await db.user.find_many()
        return users
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/users/{user_id}")
async def get_user_detail(user_id: str, token: str = Depends(oauth2_scheme)):
    """Obtener detalle de un usuario específico con sus asignaciones"""
    try:
        user = await db.user.find_unique(
            where={"id": user_id},
            include={"assignments": {"include": {"report": True}}}
        )
        
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        return {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "avatar_url": user.avatar_url,
            "is_active": user.is_active,
            "created_at": user.created_at,
            "updated_at": user.updated_at,
            "assignments": user.assignments
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/users")
async def create_user(user_data: dict, token: str = Depends(oauth2_scheme)):
    """Crear un nuevo usuario en el sistema"""
    try:
        # Verificar si el email ya existe
        existing_user = await db.user.find_unique(where={"email": user_data["email"]})
        if existing_user:
            raise HTTPException(status_code=400, detail="El correo ya está registrado")
        
        # Hashear contraseña
        hashed_password = pwd_context.hash(user_data["password"])
        
        # Crear usuario
        new_user = await db.user.create(
            data={
                "name": user_data["name"],
                "email": user_data["email"],
                "password_hash": hashed_password,
                "role": user_data["role"],
                "is_active": True,
            }
        )
        
        return {
            "id": new_user.id,
            "name": new_user.name,
            "email": new_user.email,
            "role": new_user.role,
            "is_active": new_user.is_active
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/users/{user_id}/reset-password")
async def reset_password(user_id: str, token: str = Depends(oauth2_scheme)):
    """Restablecer contraseña del usuario a 'Unam26!#'"""
    try:
        hashed = pwd_context.hash("Unam26!#")
        await db.user.update(where={"id": user_id}, data={"password_hash": hashed})
        return {"message": "Contraseña restablecida"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.patch("/api/users/{user_id}/toggle-active")
async def toggle_user_active(user_id: str, token: str = Depends(oauth2_scheme)):
    """Activar o desactivar un usuario"""
    try:
        user = await db.user.find_unique(where={"id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        updated_user = await db.user.update(
            where={"id": user_id},
            data={"is_active": not user.is_active}
        )
        
        return {"is_active": updated_user.is_active}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/users/{user_id}")
async def delete_user(user_id: str, token: str = Depends(oauth2_scheme)):
    """Eliminar un usuario y todas sus asignaciones"""
    try:
        await db.assignment.delete_many(where={"technician_id": user_id})
        await db.user.delete(where={"id": user_id})
        return {"message": "Usuario eliminado"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==========================================
# MÓDULO DE MENSAJES / NOTIFICACIONES
# ==========================================

@app.get("/api/notifications")
async def get_notifications(token: str = Depends(oauth2_scheme)):
    """Obtener todas las notificaciones del usuario actual"""
    try:
        user_data = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        current_user = await db.user.find_unique(where={"email": user_data.get("sub")})
        
        if not current_user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        notifications = await db.notification.find_many(
            where={"user_id": current_user.id},
            order={"created_at": "desc"},
            include={"report": True}
        )
        
        return [
            {
                "id": n.id,
                "user_id": str(n.user_id),
                "report_id": n.report_id,
                "type": n.type,
                "message": n.message,
                "is_read": n.is_read,
                "created_at": n.created_at,
                "report": {
                    "id": n.report.id,
                    "report_number": n.report.report_number,
                    "status": n.report.status
                } if n.report else None
            }
            for n in notifications
        ]
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.patch("/api/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: int, token: str = Depends(oauth2_scheme)):
    """Marcar una notificación específica como leída"""
    try:
        user_data = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        current_user = await db.user.find_unique(where={"email": user_data.get("sub")})
        
        if not current_user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        await db.notification.update(
            where={"id": notification_id, "user_id": current_user.id},
            data={"is_read": True}
        )
        return {"message": "Notificación marcada como leída"}
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/notifications/mark-all-read")
async def mark_all_notifications_read(token: str = Depends(oauth2_scheme)):
    """Marcar todas las notificaciones del usuario como leídas"""
    try:
        user_data = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        current_user = await db.user.find_unique(where={"email": user_data.get("sub")})
        
        if not current_user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        await db.notification.update_many(
            where={"user_id": current_user.id, "is_read": False},
            data={"is_read": True}
        )
        return {"message": "Todas las notificaciones marcadas como leídas"}
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/comments")
async def get_all_comments(token: str = Depends(oauth2_scheme)):
    """Obtener todos los comentarios del sistema (con filtros por rol)"""
    try:
        user_data = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        current_user = await db.user.find_unique(where={"email": user_data.get("sub")})
        
        if not current_user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        # Obtener comentarios
        comments = await db.reporthistory.find_many(
            where={"action": "comment"},
            order={"created_at": "desc"},
            include={"user": True, "report": True}
        )
        
        # Filtrar por permisos
        if current_user.role not in ["admin", "coordinator"]:
            # Reportes donde el usuario es reporter
            my_reports = await db.report.find_many(
                where={"reporter_id": current_user.id},
                select={"id": True}
            )
            my_report_ids = [r.id for r in my_reports]
            
            # Reportes donde el usuario es técnico asignado
            my_assignments = await db.assignment.find_many(
                where={"technician_id": current_user.id},
                select={"report_id": True}
            )
            my_assigned_ids = [a.report_id for a in my_assignments]
            
            allowed_ids = set(my_report_ids + my_assigned_ids)
            comments = [c for c in comments if c.report_id in allowed_ids]
        
        return [
            {
                "id": c.id,
                "report_id": c.report_id,
                "user_id": str(c.user_id) if c.user_id else None,
                "comment": c.new_value,
                "created_at": c.created_at,
                "user": {
                    "id": str(c.user.id),
                    "name": c.user.name,
                    "role": c.user.role,
                    "avatar_url": c.user.avatar_url
                } if c.user else None,
                "report": {
                    "id": c.report.id,
                    "report_number": c.report.report_number,
                    "status": c.report.status
                } if c.report else None
            }
            for c in comments
        ]
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/comments/report/{report_id}")
async def get_report_comments(report_id: int, token: str = Depends(oauth2_scheme)):
    """Obtener comentarios de un reporte específico"""
    try:
        user_data = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        current_user = await db.user.find_unique(where={"email": user_data.get("sub")})
        
        if not current_user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        # Verificar acceso al reporte
        report = await db.report.find_unique(
            where={"id": report_id},
            include={"assignments": True}
        )
        
        if not report:
            raise HTTPException(status_code=404, detail="Reporte no encontrado")
        
        has_access = (
            current_user.role in ["admin", "coordinator"] or
            report.reporter_id == current_user.id or
            any(a.technician_id == current_user.id for a in report.assignments)
        )
        
        if not has_access:
            raise HTTPException(status_code=403, detail="No tienes acceso a este reporte")
        
        comments = await db.reporthistory.find_many(
            where={"report_id": report_id, "action": "comment"},
            order={"created_at": "asc"},
            include={"user": True}
        )
        
        return [
            {
                "id": c.id,
                "user_id": str(c.user_id) if c.user_id else None,
                "user_name": c.user.name if c.user else "Usuario",
                "user_role": c.user.role if c.user else "unknown",
                "comment": c.new_value,
                "created_at": c.created_at
            }
            for c in comments
        ]
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==========================================
# FIN DEL ARCHIVO
# ==========================================