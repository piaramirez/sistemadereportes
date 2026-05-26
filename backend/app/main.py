from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
from typing import Optional, List
import os

app = FastAPI(title="EduInspect API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuración JWT
SECRET_KEY = "mi-super-secreto-cambiame-en-produccion"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Configuración contraseñas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# ============================================
# MODELOS Pydantic
# ============================================
class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: str
    is_active: bool

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

# ============================================
# FUNCIONES DE AUTENTICACIÓN
# ============================================
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# ============================================
# RUTAS
# ============================================
@app.get("/")
def root():
    return {"message": "EduInspect API", "status": "running"}

@app.post("/api/auth/login", response_model=Token)
async def login(login_data: LoginRequest):
    # Buscar usuario en la BD (temporal - después con Prisma)
    # Por ahora, usuarios de prueba
    test_users = {
        "admin@edusync.com": {
            "id": "1",
            "name": "Admin",
            "email": "admin@edusync.com",
            "password_hash": get_password_hash("admin123"),
            "role": "admin"
        },
        "inspector@edusync.com": {
            "id": "2",
            "name": "María Inspector",
            "email": "inspector@edusync.com",
            "password_hash": get_password_hash("admin123"),
            "role": "inspector"
        },
        "tecnico@edusync.com": {
            "id": "3",
            "name": "Pedro Técnico",
            "email": "tecnico@edusync.com",
            "password_hash": get_password_hash("admin123"),
            "role": "technician"
        }
    }
    
    user = test_users.get(login_data.email)
    if not user or not verify_password(login_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
        )
    
    access_token = create_access_token(data={"sub": user["email"], "role": user["role"]})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": user["role"]
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

@app.get("/api/dashboard/stats")
async def get_stats():
    return {
        "total_reports": 1248,
        "pending": 24,
        "completed_last_7_days": 156,
        "avg_response_time": 4.2
    }

@app.get("/api/reports")
async def get_reports():
    return [
        {"id": 1, "report_number": "R-00001", "location": "Aula 101", "status": "pending", "date": "2024-01-15"},
        {"id": 2, "report_number": "R-00002", "location": "Baño Varones", "status": "completed", "date": "2024-01-14"},
        {"id": 3, "report_number": "R-00003", "location": "Laboratorio", "status": "in_progress", "date": "2024-01-13"},
    ]