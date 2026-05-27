from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from pydantic import BaseModel
from datetime import date, datetime
from app.database import db  # Asegúrate de que apunte a tu cliente de Prisma instanciado
# Importa aquí tu método de validación de JWT (ejemplo: get_current_user)
# from app.utils.auth import get_current_user 

router = APIRouter(prefix="/api", tags=["Reports"])

# --- SCHEMAS DE PYDANTIC ---
class CommentCreate(BaseModel):
    text: str

# --- 1. ENDPOINT: ESTADÍSTICAS DEL DASHBOARD ---
@router.get("/dashboard/stats")
async def get_dashboard_stats(): # Si usas auth: current_user: dict = Depends(get_current_user)
    try:
        # Contar total de reportes
        total_reports = await db.report.count()
        
        # Contar reportes pendientes
        pending_reports = await db.report.count(
            where={"status": "pending"}
        )
        
        # Contar reportes completados (puedes filtrar por tiempo si lo requieres)
        completed_reports = await db.report.count(
            where={"status": "completed"}
        )

        return {
            "total_reports": total_reports,
            "pending": pending_reports,
            "completed_last_7_days": completed_reports,
            "avg_response_time": 24 # Fallback estático para la métrica opcional
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al calcular estadísticas: {str(e)}"
        )

# --- 2. ENDPOINT: LISTAR TODOS LOS REPORTES (CON RELACIONES) ---
@router.get("/reports")
async def list_reports():
    try:
        # Jalamos los reportes e incluimos la ubicación y el edificio ligado usando Prisma
        db_reports = await db.report.find_many(
            include={
                "location": {
                    "include": {
                        "building": True
                    }
                },
                "reporter": True
            },
            order={"created_at": "desc"}
        )

        # Mapeamos el formato plano que espera tu componente de Next.js
        formatted_reports = []
        for r in db_reports:
            formatted_reports.append({
                "id": r.id,
                "report_number": r.report_number,
                "location": r.location.name if r.location else "Sin asignar",
                "building": r.location.building.name if r.location and r.location.building else "FES Aragón",
                "status": r.status,
                "reporter_name": r.reporter.name if r.reporter else "Anónimo",
                "date": r.report_date.strftime("%d %b %Y") if r.report_date else "S/F"
            })
            
        return formatted_reports
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al listar reportes: {str(e)}"
        )

# --- 3. ENDPOINT: DETALLE DE UN REPORTE ESPECÍFICO ---
@router.get("/reports/{report_id}")
async def get_report_detail(report_id: int):
    try:
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
            raise HTTPException(status_code=404, detail="Reporte no encontrado")
            
        return {
            "id": str(r.id),
            "report_number": r.report_number,
            "reporter_name": r.reporter.name if r.reporter else "Sarah Jenkins",
            "date": r.report_date.strftime("%d de %B, %Y") if r.report_date else "",
            "location_type": r.location.location_type if r.location else "Aulas",
            "location": r.location.name if r.location else "",
            "building": r.location.building.name if r.location and r.location.building else "",
            "status": r.status,
            "comments": r.comments
        }
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=str(e))

# --- 4. ENDPOINT: COMENTARIOS / BITÁCORA DEL REPORTE (CHAT) ---
@router.get("/reports/{report_id}/comments")
async def get_report_comments(report_id: int):
    try:
        # Usamos tu tabla 'report_history' como el almacén de mensajes del chat
        history = await db.reporthistory.find_many(
            where={"report_id": report_id, "action": "comment"},
            include={"user": True},
            order={"created_at": "asc"}
        )
        
        return [{
            "id": h.id,
            "user": h.user.name if h.user else "Sistema",
            "role": h.user.role if h.user else "admin",
            "text": h.new_value,
            "date": h.created_at.strftime("%d %b %Y • %H:%M %p") if h.created_at else ""
        } for h in history]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/reports/{report_id}/comments")
async def create_report_comment(report_id: int, payload: CommentCreate):
    try:
        # Para pruebas, buscaremos el primer administrador para simular quién comenta.
        # Lo ideal es recuperar el id desde el Token JWT: user_id = current_user.id
        fallback_user = await db.user.find_first(where={"role": "admin"})
        if not fallback_user:
            raise HTTPException(status_code=404, detail="No se encontró usuario para firmar el comentario")

        # Insertamos el mensaje en la tabla report_history bajo la acción 'comment'
        new_history = await db.reporthistory.create(
            data={
                "report_id": report_id,
                "user_id": fallback_user.id,
                "action": "comment",
                "old_value": "Ninguno",
                "new_value": payload.text
            }
        )
        return {"status": "success", "comment_id": new_history.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))