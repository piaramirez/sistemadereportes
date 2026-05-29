from fastapi import FastAPI, Depends, HTTPException, status, File, Form, UploadFile, Header
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
from typing import Optional, List
import os  # Requerido para verificar y crear directorios físicos en Docker
import uuid
from prisma import Prisma
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="EduInspect API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# REPARACIÓN: Validar y crear la carpeta static si no existe antes de montarla en Uvicorn
if not os.path.exists("static"):
    os.makedirs("static")

# Servidor de archivos estáticos para renderizar las evidencias en Next.js
app.mount("/static", StaticFiles(directory="static"), name="static")

SECRET_KEY = os.getenv("SECRET_KEY", "tu-secret-key")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
try:
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))
except ValueError:
    ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

db = Prisma()

@app.on_event("startup")
async def startup():
    await db.connect()

@app.on_event("shutdown")
async def shutdown():
    await db.disconnect()

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class StatusUpdateRequest(BaseModel):
    status: str

# Esquema Pydantic para recibir interacciones del chat
class CommentCreateRequest(BaseModel):
    comment: str

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

@app.get("/")
def root():
    return {"message": "EduInspect API", "status": "running"}

@app.post("/api/auth/login", response_model=Token)
async def login(login_data: LoginRequest):
    user = await db.user.find_unique(where={"email": login_data.email})
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email o contraseña incorrectos")
    
    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {"id": str(user.id), "name": user.name, "email": user.email, "role": user.role}
    }

@app.get("/api/users")
async def get_all_users():
    try:
        users = await db.user.find_many(order={"name": "asc"})
        return [{"id": str(u.id), "name": str(u.name), "role": str(u.role)} for u in users]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/dashboard/stats")
async def get_stats():
    total = await db.report.count()
    pending = await db.report.count(where={"status": "pending"})
    completed = await db.report.count(where={"status": "completed"})
    return {"total_reports": total, "pending": pending, "completed_last_7_days": completed}

@app.get("/api/reports")
async def get_reports():
    reports = await db.report.find_many(
        take=20, order={"created_at": "desc"},
        include={"location": {"include": {"building": True}}}
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

@app.get("/api/reports/{report_id}")
async def get_report_detail(report_id: int):
    r = await db.report.find_unique(
        where={"id": int(report_id)},
        include={"location": {"include": {"building": True}}, "reporter": True}
    )
    if not r:
        raise HTTPException(status_code=404, detail="El reporte solicitado no existe")
        
    assignment = await db.assignment.find_first(
        where={"report_id": int(report_id)},
        include={"technician": True}
    )
    technician_name = str(assignment.technician.name) if assignment and assignment.technician else "Sin técnico asignado"
    assigned_to_id = str(assignment.technician_id) if assignment else "unassigned"

    report_images = await db.image.find_many(where={"report_id": int(report_id)})

    # Consultar las calificaciones físicas de estrellas para que Next.js las precargue en el Form de Edición
    floor_eval = await db.evaluation.find_first(where={"report_id": int(report_id), "criteria_name": "Limpieza del Suelo"})
    light_eval = await db.evaluation.find_first(where={"report_id": int(report_id), "criteria_name": "Funcionalidad de Iluminación"})

    # Traer comentarios del chat de manera limpia usando la relación del esquema reporthistory
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

# GUARDAR COMENTARIOS Y LANZAR NOTIFICACIONES
@app.post("/api/reports/{report_id}/comments")
async def add_report_comment(report_id: int, payload: CommentCreateRequest, token: str = Depends(oauth2_scheme)):
    try:
        user_data = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        current_user = await db.user.find_unique(where={"email": user_data.get("sub")})
        
        if not current_user:
            raise HTTPException(status_code=404, detail="Usuario no autenticado")

        report_exists = await db.report.find_unique(where={"id": int(report_id)})
        if not report_exists:
            raise HTTPException(status_code=404, detail="El reporte no existe")

        new_comment_log = await db.reporthistory.create(
            data={
                "report": {"connect": {"id": int(report_id)}},
                "user": {"connect": {"id": current_user.id}},
                "action": "comment",
                "old_value": "chat_interaction",
                "new_value": payload.comment
            }
        )

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

    except Exception as e:
        print("\n" + "💥"*20)
        print("ERROR CRÍTICO DETECTADO EN /comments ENDPOINT:")
        print(repr(e))
        print("💥"*20 + "\n")
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/reports/{report_id}/status")
async def update_report_status(report_id: int, payload: StatusUpdateRequest, token: str = Depends(oauth2_scheme)):
    try:
        user_data = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_role = str(user_data.get("role", "")).lower()
        
        if user_role not in ["admin", "coordinator"]:
            raise HTTPException(status_code=403, detail="Tu nivel de acceso no permite actualizar estados.")

        report_exists = await db.report.find_unique(where={"id": int(report_id)})
        if not report_exists:
            raise HTTPException(status_code=404, detail="Reporte no encontrado")

        await db.report.update(where={"id": int(report_id)}, data={"status": payload.status})

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
    except Exception as e:
        print("\n" + "⚠️"*20)
        print("ERROR CRÍTICO DETECTADO EN /status ENDPOINT:")
        print(repr(e))
        print("⚠️"*20 + "\n")
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=str(e))

# ENDPOINT PATCH HOMOLOGADO: Modifica todos los campos estructurales del reporte a la par del formulario
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
    try:
        user_data = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        current_user = await db.user.find_unique(where={"email": user_data.get("sub")})
        
        if not current_user or str(current_user.role).lower() not in ["admin", "coordinator"]:
            raise HTTPException(status_code=403, detail="No tienes autorización de auditoría para editar reportes.")

        report_exists = await db.report.find_unique(
            where={"id": int(report_id)},
            include={"location": True}
        )
        if not report_exists:
            raise HTTPException(status_code=404, detail="El reporte especificado no existe.")

        # 1. ACTUALIZACIÓN ESTRUCTURADA DE EDIFICIO Y UBICACIÓN
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

        await db.report.update(
            where={"id": int(report_id)},
            data={
                "comments": comments if comments is not None else report_exists.comments,
                "location_id": location_id
            }
        )

        # 2. SINCRO DE CRITERIOS DE EVALUACIÓN (ESTRELLAS) SIN ACUMULACIÓN
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

        # 3. RE-ASIGNACIÓN RELACIONAL DEL TÉCNICO
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

        # 4. GESTIÓN FÍSICA DE ARCHIVOS E IMÁGENES
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

        # 5. REGISTRAR HISTORIAL DE MOVIMIENTOS
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

    except Exception as e:
        print("\n" + "⚙️"*20)
        print("ERROR EN PATCH /api/reports VIA FORM_DATA:")
        print(repr(e))
        print("⚙️"*20 + "\n")
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=str(e))

# ENDPOINT DELETE SEGURO CON RESTRICCIÓN POR ESTADO COMPLETED
@app.delete("/api/reports/{report_id}")
async def delete_report(report_id: int, token: str = Depends(oauth2_scheme)):
    try:
        user_data = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_role = str(user_data.get("role", "")).lower()
        
        if user_role != "admin":
            raise HTTPException(status_code=403, detail="Únicamente administradores de la UNAM pueden purgar reportes.")

        report_exists = await db.report.find_unique(where={"id": int(report_id)})
        if not report_exists:
            raise HTTPException(status_code=404, detail="El reporte no existe en la base de datos.")

        # REGLA DE SEGURIDAD CRÍTICA INSTITUCIONAL
        if str(report_exists.status).lower() == "completed":
            raise HTTPException(
                status_code=400, 
                detail="Operación rechazada: No se permite eliminar incidencias con estado 'Completado'."
            )

        await db.report.delete(where={"id": int(report_id)})
        return {"status": "success", "message": "Registro eliminado permanentemente de Postgres."}

    except Exception as e:
        print("\n" + "❌"*20)
        print("ERROR EN EL ENDPOINT DELETE:")
        print(repr(e))
        print("❌"*20 + "\n")
        if isinstance(e, HTTPException): raise e
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
    try:
        jwt_token = token
        if authorization and authorization.startswith("Bearer "):
            jwt_token = authorization.split(" ")[1]

        try:
            user_data = jwt.decode(jwt_token, SECRET_KEY, algorithms=[ALGORITHM])
        except JWTError:
            raise HTTPException(status_code=401, detail="Sesión expirada o firma de token inválida")

        reporter_user = await db.user.find_unique(where={"email": user_data.get("sub")})
        if not reporter_user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")

        user_role = str(reporter_user.role).lower()
        if user_role not in ["admin", "coordinator"]:
            raise HTTPException(status_code=403, detail="No tienes autorización para crear solicitudes.")

        building = await db.building.find_first(where={"name": building_name})
        if not building:
            building = await db.building.create(data={"name": building_name})

        location = await db.location.find_first(where={"name": classroom_name, "building_id": building.id})
        if not location:
            location = await db.location.create(data={"name": classroom_name, "location_type": location_type, "building_id": building.id})

        # REPARACIÓN COMPLETA: Evitar colisiones UniqueConstraint buscando el ID más alto de Postgres de forma segura
        last_report = await db.report.find_first(order={"id": "desc"})
        next_id = (last_report.id + 1) if last_report else 1
        generated_number = f"R-{str(next_id).zfill(5)}"
        now_dt = datetime.utcnow()

        try:
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
        except Exception as err_report:
            print(f"Fallo al registrar reporte: {str(err_report)}")
            raise HTTPException(status_code=500, detail=f"Fallo al registrar reporte: {str(err_report)}")

        try:
            await db.evaluation.create(
                data={"report": {"connect": {"id": new_report.id}}, "criteria_name": "Limpieza del Suelo", "rating": 5 if floor_cleaning == "bueno" else 1}
            )
            await db.evaluation.create(
                data={"report": {"connect": {"id": new_report.id}}, "criteria_name": "Funcionalidad de Iluminación", "rating": 5 if lighting_status == "bueno" else 1}
            )
        except Exception as err_eval:
            print(f"Fallo en criterios de evaluación: {str(err_eval)}")
            raise HTTPException(status_code=500, detail=f"Fallo en criterios de evaluación: {str(err_eval)}")

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
                
                await db.notification.create(
                    data={
                        "user": {"connect": {"id": tech_uuid}},
                        "report": {"connect": {"id": new_report.id}},
                        "type": "assignment",
                        "message": f"Se te ha asignado un nuevo reporte de mantenimiento: {generated_number}",
                        "is_read": False
                    }
                )
            except (ValueError, Exception) as err_assign:
                print(f"--- Error omitido en asignación relacional: {str(err_assign)} ---")

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
                print(f"--- Error al guardar archivo: {str(err_img)} ---")

        try:
            await db.reporthistory.create(
                data={
                    "report": {"connect": {"id": new_report.id}},
                    "user": {"connect": {"id": reporter_user.id}},
                    "action": "creation",
                    "new_value": f"Reporte {generated_number} creado con éxito."
                }
            )
        except Exception:
            pass

        return {"status": "success", "report_number": str(generated_number)}

    except Exception as e:
        print("\n" + "********")
        print("ERROR CRÍTICO DETECTADO EN /reports ENDPOINT:")
        print(repr(e))
        print("********" + "\n")
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail="Error relacional interno")
    
# --- MÓDULO GESTIÓN DE PERSONAL ---

@app.get("/api/users/{user_id}")
async def get_user_detail(user_id: str, token: str = Depends(oauth2_scheme)):
    user = await db.user.find_unique(where={"id": user_id}, include={"assignments": {"include": {"report": True}}})
    if not user: raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return {
        "id": user.id, "name": user.name, "email": user.email, "role": user.role,
        "avatar_url": user.avatar_url, "assignments": user.assignments
    }

@app.post("/api/users/{user_id}/reset-password")
async def reset_password(user_id: str, token: str = Depends(oauth2_scheme)):
    # Restablecer a: Unam26!#
    hashed = pwd_context.hash("Unam26!#")
    await db.user.update(where={"id": user_id}, data={"password_hash": hashed})
    return {"message": "Contraseña restablecida"}

@app.delete("/api/users/{user_id}")
async def delete_user(user_id: str, token: str = Depends(oauth2_scheme)):
    await db.assignment.delete_many(where={"technician_id": user_id})
    await db.user.delete(where={"id": user_id})
    return {"message": "Usuario eliminado"}