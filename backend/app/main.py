from fastapi import FastAPI, Depends, HTTPException, status
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

# CORS - Conexión directa con tu puerto 3000 de Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuración de Seguridad
SECRET_KEY = os.getenv("SECRET_KEY", "mi-super-secreto-cambiame-en-produccion")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Cliente de Prisma
db = Prisma()

@app.on_event("startup")
async def startup():
    await db.connect()

@app.on_event("shutdown")
async def shutdown():
    await db.disconnect()

# --- MODELOS DE VALIDACIÓN (PYDANTIC) ---
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class CommentCreate(BaseModel):
    text: str

# --- FUNCIONES DE CONTROL DE ACCESO ---
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# --- RUTAS DE AUTENTICACIÓN ---
@app.get("/")
def root():
    return {"message": "EduInspect API", "status": "running"}

@app.post("/api/auth/login", response_model=Token)
async def login(login_data: LoginRequest):
    user = await db.user.find_unique(where={"email": login_data.email})
    
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
        )
    
    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    }

@app.get("/api/auth/me")
async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Token inválido")
        return {"email": email, "role": payload.get("role")}
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")

# --- RUTAS DEL DASHBOARD PRINCIPAL ---
@app.get("/api/dashboard/stats")
async def get_stats():
    total = await db.report.count()
    pending = await db.report.count(where={"status": "pending"})
    completed = await db.report.count(where={"status": "completed"})
    
    return {
        "total_reports": total,
        "pending": pending,
        "completed_last_7_days": completed,
        "avg_response_time": 4.2
    }

@app.get("/api/reports")
async def get_reports():
    # Modificado para incluir de forma profunda la ubicación y el edificio asociado
    reports = await db.report.find_many(
        take=20,
        order={"created_at": "desc"},
        include={
            "location": {
                "include": {
                    "building": True
                }
            }
        }
    )
    
    return [
        {
            "id": r.id,
            "report_number": r.report_number,
            "location": r.location.name if r.location else "Sin ubicación",
            "building": r.location.building.name if r.location and r.location.building else "FES Aragón",
            "status": r.status,
            "date": r.report_date.strftime("%Y-%m-%d") if r.report_date else "S/F"
        }
        for r in reports
    ]

# --- NUEVO: ENDPOINT PARA DETALLE DE UN REPORTE INDIVIDUAL ---
@app.get("/api/reports/{report_id}")
async def get_report_detail(report_id: int):
    r = await db.report.find_unique(
        where={"id": report_id},
        include={
            "location": {
                "include": {
                    "building": True
                }
            },
            "reporter": True
        }
    )
    if not r:
        raise HTTPException(status_code=404, detail="El reporte solicitado no existe")
        
    return {
        "id": str(r.id),
        "report_number": r.report_number,
        "reporter_name": r.reporter.name if r.reporter else "Inspector UNAM",
        "date": r.report_date.strftime("%d de %B, %Y") if r.report_date else "Sin fecha",
        "location_type": r.location.location_type if r.location else "classroom",
        "location": r.location.name if r.location else "Ubicación General",
        "building": r.location.building.name if r.location and r.location.building else "FES Aragón",
        "status": r.status,
        "comments": r.comments or "Sin comentarios adicionales por el momento."
    }

# --- NUEVO: ENDPOINTS DE LA BITÁCORA DE SEGUIMIENTO (CHAT EN VIVO) ---
@app.get("/api/reports/{report_id}/comments")
async def get_report_comments(report_id: int):
    # Recuperamos los registros de la tabla report_history que actúen como comentarios
    history = await db.reporthistory.find_many(
        where={"report_id": report_id, "action": "comment"},
        include={"user": True},
        order={"created_at": "asc"}
    )
    
    return [
        {
            "id": h.id,
            "user": h.user.name if h.user else "Sistema",
            "role": h.user.role if h.user else "admin",
            "text": h.new_value,
            "date": h.created_at.strftime("%d %b %Y • %H:%M %p") if h.created_at else "Ahora"
        } 
        for h in history
    ]

@app.post("/api/reports/{report_id}/comments")
async def create_report_comment(report_id: int, payload: CommentCreate):
    # Buscamos un usuario administrador por defecto para firmar el mensaje temporalmente
    fallback_user = await db.user.find_first(where={"role": "admin"})
    if not fallback_user:
        raise HTTPException(status_code=404, detail="No se encontró un usuario válido para registrar el comentario")

    # Guardamos la intervención en la tabla report_history mapeada en tu init.sql
    new_comment = await db.reporthistory.create(
        data={
            "report_id": report_id,
            "user_id": fallback_user.id,
            "action": "comment",
            "old_value": "Ninguno",
            "new_value": payload.text
        }
    )
    return {"status": "success", "comment_id": new_comment.id}