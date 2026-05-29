# ==========================================
# ARCHIVO: app/routers/reports.py
# AUTOR: Pedro Antonio Ramírez Alcántara
# MATERIA: Vinculación Empresarial
# GRUPO: 2007 (2026-II)
# DOCENTE: Aarón Velasco Agustín
# CARRERA: Ingeniería en Computación - FES Aragón
# FUNCIÓN: Endpoints de reportes, estadísticas y comentarios
# ==========================================

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel
from datetime import date, datetime, timedelta
from app.database import db  # Cliente de Prisma para PostgreSQL
import os

# NOTA: Para producción, descomentar y usar autenticación JWT
# from app.utils.auth import get_current_user

# ==========================================
# CONFIGURACIÓN DEL ROUTER
# ==========================================
router = APIRouter(prefix="/api", tags=["Reports"])


# ==========================================
# SCHEMAS PYDANTIC (Validación de datos)
# ==========================================

class CommentCreate(BaseModel):
    """Esquema para crear un nuevo comentario en un reporte"""
    text: str


class ReportCreate(BaseModel):
    """Esquema para crear un nuevo reporte"""
    location_type: str
    building_name: str
    classroom_name: str
    comments: str
    floor_cleaning: str  # "bueno" o "malo"
    lighting_status: str  # "bueno" o "malo"
    assigned_to_id: Optional[str] = None


class ReportUpdate(BaseModel):
    """Esquema para actualizar un reporte existente"""
    status: Optional[str] = None
    comments: Optional[str] = None
    assigned_to_id: Optional[str] = None


# ==========================================
# ENDPOINT 1: ESTADÍSTICAS DEL DASHBOARD
# ==========================================
@router.get("/dashboard/stats")
async def get_dashboard_stats():
    """
    Obtiene estadísticas para el panel de control principal.
    
    Retorna:
        - total_reports: Cantidad total de reportes
        - pending: Reportes en estado pendiente
        - completed_last_7_days: Reportes completados en los últimos 7 días
        - avg_response_time: Tiempo promedio de respuesta (en horas)
    """
    try:
        # Contar total de reportes
        total_reports = await db.report.count()
        
        # Contar reportes pendientes
        pending_reports = await db.report.count(
            where={"status": "pending"}
        )
        
        # Calcular reportes completados en los últimos 7 días
        seven_days_ago = datetime.now() - timedelta(days=7)
        completed_reports_last_7d = await db.report.count(
            where={
                "status": "completed",
                "updated_at": {"gte": seven_days_ago}
            }
        )
        
        # Tiempo promedio de respuesta (ejemplo - se puede calcular real con más datos)
        avg_response_time = 24  # Horas, valor por defecto
        
        return {
            "total_reports": total_reports,
            "pending": pending_reports,
            "completed_last_7_days": completed_reports_last_7d,
            "avg_response_time": avg_response_time
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al calcular estadísticas: {str(e)}"
        )


# ==========================================
# ENDPOINT 2: LISTAR TODOS LOS REPORTES
# ==========================================
@router.get("/reports")
async def list_reports(
    status_filter: Optional[str] = None,  # Filtro opcional por estado
    building_id: Optional[int] = None,    # Filtro opcional por edificio
    limit: int = 50,                       # Límite de resultados
    offset: int = 0                        # Paginación
):
    """
    Lista todos los reportes con información de ubicación y reportero.
    
    Parámetros opcionales:
        - status_filter: Filtrar por estado (pending, assigned, completed, etc.)
        - building_id: Filtrar por edificio
        - limit: Cantidad de resultados por página
        - offset: Desplazamiento para paginación
    """
    try:
        # Construir filtros dinámicamente
        where_clause = {}
        
        if status_filter:
            where_clause["status"] = status_filter
            
        if building_id:
            where_clause["location"] = {
                "building_id": building_id
            }
        
        # Obtener reportes con relaciones
        db_reports = await db.report.find_many(
            where=where_clause if where_clause else None,
            include={
                "location": {
                    "include": {
                        "building": True
                    }
                },
                "reporter": True,
                "assignments": {
                    "include": {"technician": True}
                }
            },
            order={"created_at": "desc"},
            take=limit,
            skip=offset
        )
        
        # Formatear respuesta para el frontend
        formatted_reports = []
        for r in db_reports:
            # Obtener técnico asignado si existe
            technician_name = None
            if r.assignments and len(r.assignments) > 0:
                technician_name = r.assignments[0].technician.name if r.assignments[0].technician else None
            
            formatted_reports.append({
                "id": r.id,
                "report_number": r.report_number,
                "location": r.location.name if r.location else "Sin asignar",
                "building": r.location.building.name if r.location and r.location.building else "FES Aragón",
                "status": r.status,
                "reporter_name": r.reporter.name if r.reporter else "Anónimo",
                "technician_name": technician_name,
                "date": r.report_date.strftime("%d %b %Y") if r.report_date else "S/F",
                "created_at": r.created_at
            })
            
        return formatted_reports
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al listar reportes: {str(e)}"
        )


# ==========================================
# ENDPOINT 3: DETALLE DE UN REPORTE ESPECÍFICO
# ==========================================
@router.get("/reports/{report_id}")
async def get_report_detail(report_id: int):
    """
    Obtiene todos los detalles de un reporte específico por su ID.
    
    Incluye:
        - Información básica del reporte
        - Ubicación y edificio
        - Reportero
        - Técnico asignado
        - Evaluaciones (calificaciones)
        - Imágenes asociadas
        - Historial de comentarios
    """
    try:
        # Buscar reporte con todas sus relaciones
        r = await db.report.find_unique(
            where={"id": report_id},
            include={
                "location": {
                    "include": {
                        "building": True
                    }
                },
                "reporter": True,
                "assignments": {
                    "include": {"technician": True, "assigner": True}
                },
                "evaluations": True,
                "images": True
            }
        )
        
        if not r:
            raise HTTPException(status_code=404, detail="Reporte no encontrado")
        
        # Obtener técnico asignado
        technician = None
        assignment_status = None
        if r.assignments and len(r.assignments) > 0:
            tech = r.assignments[0].technician
            technician = tech.name if tech else None
            assignment_status = r.assignments[0].status
        
        # Obtener calificaciones
        floor_cleaning_rating = None
        lighting_rating = None
        for eval_item in r.evaluations:
            if eval_item.criteria_name == "Limpieza del Suelo":
                floor_cleaning_rating = eval_item.rating
            elif eval_item.criteria_name == "Funcionalidad de Iluminación":
                lighting_rating = eval_item.rating
        
        # Obtener comentarios del historial
        comments = await get_report_comments_history(report_id)
        
        return {
            "id": str(r.id),
            "report_number": r.report_number,
            "reporter_name": r.reporter.name if r.reporter else "Usuario UNAM",
            "reporter_id": str(r.reporter.id) if r.reporter else None,
            "date": r.report_date.strftime("%d de %B, %Y") if r.report_date else "",
            "date_iso": r.report_date.isoformat() if r.report_date else None,
            "location_type": r.location.location_type if r.location else "classroom",
            "location": r.location.name if r.location else "",
            "building": r.location.building.name if r.location and r.location.building else "FES Aragón",
            "building_id": r.location.building_id if r.location else None,
            "status": r.status,
            "comments": r.comments or "",
            "assigned_technician": technician,
            "assigned_to_id": r.assignments[0].technician_id if r.assignments and len(r.assignments) > 0 else None,
            "assignment_status": assignment_status,
            "floor_cleaning_rating": floor_cleaning_rating or 5,
            "lighting_rating": lighting_rating or 5,
            "images": [{"url": img.url, "caption": img.caption} for img in r.images],
            "chat_comments": comments,
            "created_at": r.created_at,
            "updated_at": r.updated_at
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener detalle del reporte: {str(e)}"
        )


# ==========================================
# ENDPOINT 4: OBTENER COMENTARIOS DE UN REPORTE
# ==========================================
async def get_report_comments_history(report_id: int):
    """
    Función auxiliar para obtener el historial de comentarios de un reporte.
    """
    try:
        history = await db.reporthistory.find_many(
            where={"report_id": report_id, "action": "comment"},
            include={"user": True},
            order={"created_at": "asc"}
        )
        
        return [{
            "id": h.id,
            "user_name": h.user.name if h.user else "Sistema",
            "user_role": h.user.role if h.user else "admin",
            "user_avatar": h.user.avatar_url if h.user else None,
            "comment": h.new_value,
            "created_at": h.created_at.strftime("%d %b %Y • %H:%M") if h.created_at else "",
            "created_at_raw": h.created_at
        } for h in history]
        
    except Exception as e:
        return []


@router.get("/reports/{report_id}/comments")
async def get_report_comments_endpoint(report_id: int):
    """
    Endpoint público para obtener los comentarios de un reporte.
    """
    try:
        comments = await get_report_comments_history(report_id)
        return comments
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener comentarios: {str(e)}"
        )


# ==========================================
# ENDPOINT 5: CREAR COMENTARIO EN UN REPORTE
# ==========================================
@router.post("/reports/{report_id}/comments")
async def create_report_comment(
    report_id: int, 
    payload: CommentCreate,
    # user_id: str = Depends(get_current_user)  # Descomentar en producción
):
    """
    Crea un nuevo comentario en el reporte especificado.
    
    El comentario se guarda en la tabla report_history con acción 'comment'.
    """
    try:
        # Verificar que el reporte existe
        report_exists = await db.report.find_unique(where={"id": report_id})
        if not report_exists:
            raise HTTPException(status_code=404, detail="El reporte no existe")
        
        # OBTENER USUARIO AUTENTICADO
        # En producción, descomentar la línea de Depends y usar user_id real
        # Por ahora, buscamos al admin por defecto o al primer usuario disponible
        fallback_user = await db.user.find_first()
        if not fallback_user:
            raise HTTPException(status_code=404, detail="No hay usuarios en el sistema")
        
        user_id = fallback_user.id
        
        # Insertar comentario en report_history
        new_history = await db.reporthistory.create(
            data={
                "report_id": report_id,
                "user_id": user_id,
                "action": "comment",
                "old_value": "Ninguno",
                "new_value": payload.text
            }
        )
        
        # CREAR NOTIFICACIÓN para el técnico asignado o reportero
        assignment = await db.assignment.find_first(where={"report_id": report_id})
        
        if assignment and assignment.technician_id:
            # Notificar al técnico asignado
            await db.notification.create(
                data={
                    "user_id": assignment.technician_id,
                    "report_id": report_id,
                    "type": "comment",
                    "message": f"Nuevo comentario en el reporte {report_exists.report_number}",
                    "is_read": False
                }
            )
        
        return {
            "status": "success", 
            "comment_id": new_history.id,
            "message": "Comentario agregado correctamente"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear comentario: {str(e)}"
        )


# ==========================================
# ENDPOINT 6: ACTUALIZAR ESTADO DE UN REPORTE
# ==========================================
@router.patch("/reports/{report_id}/status")
async def update_report_status(
    report_id: int, 
    payload: ReportUpdate,
    # user_id: str = Depends(get_current_user)  # Descomentar en producción
):
    """
    Actualiza el estado de un reporte.
    
    Estados posibles: pending, assigned, in_progress, completed, cancelled
    """
    try:
        # Verificar que el reporte existe
        report_exists = await db.report.find_unique(where={"id": report_id})
        if not report_exists:
            raise HTTPException(status_code=404, detail="Reporte no encontrado")
        
        # Guardar estado anterior para el historial
        old_status = report_exists.status
        
        # Actualizar estado
        updated_report = await db.report.update(
            where={"id": report_id},
            data={"status": payload.status}
        )
        
        # Registrar en historial
        # Obtener usuario autenticado (fallback por ahora)
        fallback_user = await db.user.find_first()
        if fallback_user:
            await db.reporthistory.create(
                data={
                    "report_id": report_id,
                    "user_id": fallback_user.id,
                    "action": "status_change",
                    "old_value": old_status,
                    "new_value": payload.status
                }
            )
        
        # CREAR NOTIFICACIÓN para el reportero
        if report_exists.reporter_id:
            await db.notification.create(
                data={
                    "user_id": report_exists.reporter_id,
                    "report_id": report_id,
                    "type": "status_change",
                    "message": f"El reporte {report_exists.report_number} cambió a estado: {payload.status}",
                    "is_read": False
                }
            )
        
        return {
            "status": "success",
            "new_status": payload.status,
            "message": "Estado actualizado correctamente"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al actualizar estado: {str(e)}"
        )


# ==========================================
# ENDPOINT 7: ACTUALIZAR REPORTE COMPLETO
# ==========================================
@router.put("/reports/{report_id}")
async def update_report_full(
    report_id: int,
    payload: ReportUpdate,
    # user_id: str = Depends(get_current_user)  # Descomentar en producción
):
    """
    Actualización completa de un reporte (todos los campos).
    """
    try:
        # Verificar que el reporte existe
        report_exists = await db.report.find_unique(where={"id": report_id})
        if not report_exists:
            raise HTTPException(status_code=404, detail="Reporte no encontrado")
        
        # Construir datos a actualizar (solo los campos presentes)
        update_data = {}
        if payload.status is not None:
            update_data["status"] = payload.status
        if payload.comments is not None:
            update_data["comments"] = payload.comments
        
        if update_data:
            updated_report = await db.report.update(
                where={"id": report_id},
                data=update_data
            )
        
        # Actualizar asignación si se envió
        if payload.assigned_to_id:
            existing_assignment = await db.assignment.find_first(
                where={"report_id": report_id}
            )
            
            if existing_assignment:
                await db.assignment.update(
                    where={"id": existing_assignment.id},
                    data={"technician_id": payload.assigned_to_id}
                )
            else:
                # Obtener usuario autenticado para assigner_id
                fallback_user = await db.user.find_first()
                assigner_id = fallback_user.id if fallback_user else None
                
                await db.assignment.create(
                    data={
                        "report_id": report_id,
                        "technician_id": payload.assigned_to_id,
                        "assigner_id": assigner_id,
                        "status": "assigned"
                    }
                )
            
            # Actualizar estado del reporte a 'assigned'
            await db.report.update(
                where={"id": report_id},
                data={"status": "assigned"}
            )
        
        return {
            "status": "success",
            "message": "Reporte actualizado correctamente"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al actualizar reporte: {str(e)}"
        )


# ==========================================
# ENDPOINT 8: ELIMINAR REPORTE (SOLO ADMIN)
# ==========================================
@router.delete("/reports/{report_id}")
async def delete_report(
    report_id: int,
    # user_id: str = Depends(get_current_user),  # Descomentar en producción
    # user_role: str = Depends(get_user_role)    # Verificar rol admin
):
    """
    Elimina un reporte (solo accesible para administradores).
    """
    try:
        # Verificar que el reporte existe
        report_exists = await db.report.find_unique(where={"id": report_id})
        if not report_exists:
            raise HTTPException(status_code=404, detail="Reporte no encontrado")
        
        # No permitir eliminar reportes completados (regla de negocio)
        if report_exists.status == "completed":
            raise HTTPException(
                status_code=400,
                detail="No se pueden eliminar reportes completados"
            )
        
        # Eliminar reporte (las relaciones en cascada se encargan del resto)
        await db.report.delete(where={"id": report_id})
        
        return {
            "status": "success",
            "message": f"Reporte {report_exists.report_number} eliminado correctamente"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al eliminar reporte: {str(e)}"
        )


# ==========================================
# ENDPOINT 9: CREAR NUEVO REPORTE
# ==========================================
@router.post("/reports")
async def create_new_report(
    payload: ReportCreate,
    # user_id: str = Depends(get_current_user)  # Descomentar en producción
):
    """
    Crea un nuevo reporte de incidencia.
    
    Proceso:
        1. Verificar/Crear edificio
        2. Verificar/Crear ubicación
        3. Crear el reporte
        4. Crear evaluaciones (calificaciones)
        5. Asignar técnico (si se especificó)
        6. Crear notificación
    """
    try:
        # Obtener usuario autenticado (reporter)
        fallback_user = await db.user.find_first(where={"role": "admin"})
        if not fallback_user:
            raise HTTPException(status_code=404, detail="No hay usuarios en el sistema")
        
        reporter_id = fallback_user.id
        
        # 1. Verificar o crear edificio
        building = await db.building.find_first(where={"name": payload.building_name})
        if not building:
            building = await db.building.create(
                data={"name": payload.building_name, "description": f"Edificio {payload.building_name}"}
            )
        
        # 2. Verificar o crear ubicación
        location = await db.location.find_first(
            where={
                "name": payload.classroom_name,
                "building_id": building.id
            }
        )
        if not location:
            location = await db.location.create(
                data={
                    "name": payload.classroom_name,
                    "location_type": payload.location_type,
                    "building_id": building.id
                }
            )
        
        # 3. Generar número de reporte
        last_report = await db.report.find_first(order={"id": "desc"})
        next_id = (last_report.id + 1) if last_report else 1
        report_number = f"R-{str(next_id).zfill(5)}"
        
        # 4. Crear reporte
        new_report = await db.report.create(
            data={
                "report_number": report_number,
                "reporter_id": reporter_id,
                "location_id": location.id,
                "report_date": datetime.now(),
                "inspection_date": datetime.now(),
                "comments": payload.comments,
                "status": "assigned" if payload.assigned_to_id else "pending"
            }
        )
        
        # 5. Crear evaluaciones
        floor_cleaning_rating = 5 if payload.floor_cleaning == "bueno" else 1
        lighting_rating = 5 if payload.lighting_status == "bueno" else 1
        
        await db.evaluation.create_many(
            data=[
                {
                    "report_id": new_report.id,
                    "criteria_name": "Limpieza del Suelo",
                    "rating": floor_cleaning_rating
                },
                {
                    "report_id": new_report.id,
                    "criteria_name": "Funcionalidad de Iluminación",
                    "rating": lighting_rating
                }
            ]
        )
        
        # 6. Asignar técnico si se especificó
        if payload.assigned_to_id and payload.assigned_to_id != "unassigned":
            await db.assignment.create(
                data={
                    "report_id": new_report.id,
                    "technician_id": payload.assigned_to_id,
                    "assigner_id": reporter_id,
                    "status": "assigned"
                }
            )
            
            # Crear notificación para el técnico
            await db.notification.create(
                data={
                    "user_id": payload.assigned_to_id,
                    "report_id": new_report.id,
                    "type": "assignment",
                    "message": f"Se te ha asignado el reporte {report_number}",
                    "is_read": False
                }
            )
        
        # 7. Registrar en historial
        await db.reporthistory.create(
            data={
                "report_id": new_report.id,
                "user_id": reporter_id,
                "action": "creation",
                "new_value": f"Reporte {report_number} creado exitosamente"
            }
        )
        
        return {
            "status": "success",
            "report_id": new_report.id,
            "report_number": report_number,
            "message": "Reporte creado correctamente"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear reporte: {str(e)}"
        )


# ==========================================
# ENDPOINT 10: LISTAR EDIFICIOS (para selects)
# ==========================================
@router.get("/buildings")
async def list_buildings():
    """
    Lista todos los edificios disponibles.
    Útil para los selects del formulario de creación de reportes.
    """
    try:
        buildings = await db.building.find_many(
            order={"name": "asc"}
        )
        
        return [
            {
                "id": b.id,
                "name": b.name,
                "description": b.description
            }
            for b in buildings
        ]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al listar edificios: {str(e)}"
        )


# ==========================================
# ENDPOINT 11: LISTAR UBICACIONES POR EDIFICIO
# ==========================================
@router.get("/buildings/{building_id}/locations")
async def list_locations_by_building(building_id: int):
    """
    Lista todas las ubicaciones de un edificio específico.
    """
    try:
        locations = await db.location.find_many(
            where={"building_id": building_id},
            order={"name": "asc"}
        )
        
        return [
            {
                "id": loc.id,
                "name": loc.name,
                "location_type": loc.location_type,
                "floor": loc.floor,
                "code": loc.code
            }
            for loc in locations
        ]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al listar ubicaciones: {str(e)}"
        )


# ==========================================
# ENDPOINT 12: LISTAR TÉCNICOS (para asignaciones)
# ==========================================
@router.get("/technicians")
async def list_technicians():
    """
    Lista todos los usuarios con rol 'technician' para asignar reportes.
    """
    try:
        technicians = await db.user.find_many(
            where={"role": "technician", "is_active": True},
            order={"name": "asc"}
        )
        
        return [
            {
                "id": str(tech.id),
                "name": tech.name,
                "email": tech.email
            }
            for tech in technicians
        ]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al listar técnicos: {str(e)}"
        )