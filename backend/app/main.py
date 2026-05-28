from fastapi import FastAPI, Depends, HTTPException, status, File, Form, UploadFile, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
from typing import Optional, List
import os
from prisma import Prisma

app = FastAPI(title="EduInspect API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = os.getenv("SECRET_KEY", "mi-super-secreto-cambiame-en-produccion")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

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

class CommentCreate(BaseModel):
    text: str

class StatusUpdateRequest(BaseModel):
    status: str

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
        "user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role}
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
        "comments": str(r.comments) or "Sin comentarios adicionales por el momento.",
        "assigned_technician": technician_name,
        "assigned_to_id": assigned_to_id,
        "images": [{"url": str(img.url), "caption": str(img.caption)} for img in report_images]
    }

@app.get("/api/reports/{report_id}/comments")
async def get_report_comments(report_id: int):
    history = await db.reporthistory.find_many(
        where={"report_id": int(report_id), "action": "comment"},
        include={"user": True},
        order={"created_at": "asc"}
    )
    return [
        {
            "id": int(h.id),
            "user": str(h.user.name) if h.user else "Sistema",
            "role": str(h.user.role) if h.user else "admin",
            "text": str(h.new_value),
            "date": h.created_at.strftime("%d %b %Y • %H:%M %p") if h.created_at else "Ahora"
        } 
        for h in history
    ]

@app.post("/api/reports/{report_id}/comments")
async def create_report_comment(report_id: int, payload: CommentCreate):
    fallback_user = await db.user.find_first(where={"role": "admin"})
    if not fallback_user:
        raise HTTPException(status_code=404, detail="No se encontró un usuario válido")

    await db.reporthistory.create(
        data={"report_id": int(report_id), "user_id": fallback_user.id, "action": "comment", "old_value": "Ninguno", "new_value": payload.text}
    )
    return {"status": "success", "message": "Comentario guardado"}

@app.put("/api/reports/{report_id}/status")
async def update_report_status(report_id: int, payload: StatusUpdateRequest, token: str = Depends(oauth2_scheme)):
    try:
        user_data = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if user_data.get("role", "").lower() not in ["admin", "coordinator"]:
            raise HTTPException(status_code=403, detail="Privilegios insuficientes.")

        report_exists = await db.report.find_unique(where={"id": int(report_id)})
        if not report_exists:
            raise HTTPException(status_code=404, detail="Reporte no encontrado")

        await db.report.update(where={"id": int(report_id)}, data={"status": payload.status})

        current_user = await db.user.find_unique(where={"email": user_data.get("sub")})
        if current_user:
            await db.reporthistory.create(
                data={"report_id": int(report_id), "user_id": current_user.id, "action": "status_change", "old_value": report_exists.status or "pending", "new_value": payload.status}
            )
        return {"status": "success", "new_status": str(payload.status)}
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/reports/{report_id}")
async def edit_report(
    report_id: int,
    comments: str = Form(...),
    status: str = Form(...),
    assigned_to_id: Optional[str] = Form(None),
    report_date: Optional[str] = Form(None), 
    file: Optional[UploadFile] = File(None)
):
    try:
        report_exists = await db.report.find_unique(where={"id": int(report_id)})
        if not report_exists:
            raise HTTPException(status_code=404, detail="Reporte no encontrado")

        if report_exists.status in ["completed", "cancelled"]:
            raise HTTPException(status_code=400, detail="El reporte ya está inmutable.")

        if file:
            upload_dir = "static/uploads"
            os.makedirs(upload_dir, exist_ok=True)
            file_name = f"{int(datetime.utcnow().timestamp())}_{file.filename}"
            file_path = os.path.join(upload_dir, file_name)
            
            with open(file_path, "wb") as buffer:
                buffer.write(await file.read())
            
            await db.image.create(
                data={"report_id": int(report_id), "url": f"http://localhost:8000/{file_path}", "caption": "Evidencia añadida desde edición."}
            )

        update_data = {"comments": comments, "status": status}
        if report_date and report_date.strip() != "":
            try:
                update_data["report_date"] = datetime.strptime(report_date, "%Y-%m-%d").date()
            except ValueError:
                pass

        await db.report.update(where={"id": int(report_id)}, data=update_data)

        if assigned_to_id and assigned_to_id != "unassigned":
            existing_assignment = await db.assignment.find_first(where={"report_id": int(report_id)})
            if existing_assignment:
                await db.assignment.update(where={"id": int(existing_assignment.id)}, data={"technician_id": assigned_to_id, "status": "assigned"})
            else:
                admin_user = await db.user.find_first(where={"role": "admin"})
                await db.assignment.create(data={"report_id": int(report_id), "technician_id": assigned_to_id, "assigned_by": admin_user.id if admin_user else None, "status": "assigned"})

        fallback_user = await db.user.find_first(where={"role": "admin"})
        if fallback_user:
            await db.reporthistory.create(
                data={"report_id": int(report_id), "user_id": fallback_user.id, "action": "admin_edit_full", "old_value": f"Status: {report_exists.status}", "new_value": f"Status: {status}"}
            )
        return {"status": "success", "message": "Actualización procesada"}
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail="Error de serialización interna")

@app.delete("/api/reports/{report_id}")
async def delete_report(report_id: int):
    try:
        await db.report.delete(where={"id": report_id})
        return {"status": "success"}
    except Exception as e:
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
    authorization: Optional[str] = Header(None), # Interceptamos directo el Header
    token: str = Depends(oauth2_scheme)           # Mantenemos compatibilidad con OpenAPI/Swagger
):
    try:
        # Fallback Robusto: Si Depends falla por formateo multiparte, extraemos del string de cabecera
        jwt_token = token
        if authorization and authorization.startswith("Bearer "):
            jwt_token = authorization.split(" ")[1]

        try:
            user_data = jwt.decode(jwt_token, SECRET_KEY, algorithms=[ALGORITHM])
        except JWTError:
            raise HTTPException(status_code=401, detail="Sesión expirada o inválida")

        reporter_user = await db.user.find_unique(where={"email": user_data.get("sub")})
        if not reporter_user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")

        building = await db.building.find_first(where={"name": building_name})
        if not building:
            building = await db.building.create(data={"name": building_name})

        location = await db.location.find_first(where={"name": classroom_name, "building_id": building.id})
        if not location:
            location = await db.location.create(data={"name": classroom_name, "location_type": location_type, "building_id": building.id})

        total_reports = await db.report.count()
        generated_number = f"R-{str(total_reports + 1).zfill(5)}"
        now_date = datetime.utcnow().date()

        new_report = await db.report.create(
            data={
                "report_number": generated_number,
                "reporter_id": reporter_user.id,
                "location_id": location.id,
                "comments": comments,
                "status": "pending" if (not assigned_to_id or assigned_to_id == "unassigned") else "assigned",
                "report_date": now_date,
                "inspection_date": now_date
            }
        )

        await db.evaluation.create(
            data={"report_id": new_report.id, "criteria_name": "Limpieza del Suelo", "rating": 5 if floor_cleaning == "bueno" else 1}
        )
        await db.evaluation.create(
            data={"report_id": new_report.id, "criteria_name": "Funcionalidad de Iluminación", "rating": 5 if lighting_status == "bueno" else 1}
        )

        if assigned_to_id and assigned_to_id != "unassigned":
            await db.assignment.create(
                data={"report_id": new_report.id, "technician_id": assigned_to_id, "assigned_by": reporter_user.id, "status": "assigned"}
            )

        if file:
            upload_dir = "static/uploads"
            os.makedirs(upload_dir, exist_ok=True)
            file_path = os.path.join(upload_dir, f"{int(datetime.utcnow().timestamp())}_{file.filename}")
            with open(file_path, "wb") as buffer:
                buffer.write(await file.read())
            
            await db.image.create(
                data={"report_id": new_report.id, "url": f"http://localhost:8000/{file_path}", "caption": "Evidencia inicial."}
            )

        await db.reporthistory.create(
            data={"report_id": new_report.id, "user_id": reporter_user.id, "action": "creation", "new_value": f"Reporte {generated_number} creado con éxito."}
        )

        return {"status": "success", "report_number": generated_number}

    except Exception as e:
        if isinstance(e, HTTPException): raise e
        print(f"--- ERROR AL CREAR REPORTE EN BACKEND: {str(e)} ---")
        raise HTTPException(status_code=500, detail=str(e))