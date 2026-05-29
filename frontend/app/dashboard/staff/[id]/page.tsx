// ==========================================
// ARCHIVO: frontend/app/dashboard/staff/[id]/page.tsx
// AUTOR: Pedro Antonio Ramírez Alcántara
// MATERIA: Vinculación Empresarial
// GRUPO: 2007 (2026-II)
// DOCENTE: Aarón Velasco Agustín
// CARRERA: Ingeniería en Computación - FES Aragón
// FUNCIÓN: Detalle de un usuario del sistema (personal)
// ==========================================

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import apiClient from "@/lib/axios";

// ==========================================
// INTERFACES / TIPOS
// ==========================================

interface Assignment {
  id: number;
  report_id: number;
  technician_id: string;
  status: string;
  report: {
    id: number;
    report_number: string;
    status: string;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  assignments: Assignment[];
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export default function StaffDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // ==========================================
  // EFECTOS
  // ==========================================

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const res = await apiClient.get(`/api/users/${id}`);
        setUser(res.data);
      } catch (error) {
        console.error("Error al cargar usuario:", error);
        alert("Error al cargar los datos del usuario");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id, router]);

  // ==========================================
  // FUNCIONES DE ACCIONES
  // ==========================================

  /**
   * Restablece la contraseña del usuario a "Unam26!#"
   */
  const resetPass = async () => {
    if (!confirm("¿Restablecer contraseña a Unam26!#?")) return;

    try {
      await apiClient.post(`/api/users/${id}/reset-password`);
      alert("✓ Contraseña restablecida a: Unam26!#");
    } catch (error) {
      console.error("Error al restablecer contraseña:", error);
      alert("Error al restablecer contraseña");
    }
  };

  /**
   * Elimina el usuario del sistema
   * También elimina todas sus asignaciones relacionadas
   */
  const deleteUser = async () => {
    if (
      !confirm(
        "⚠️ ¿Eliminar este usuario? También se eliminarán sus asignaciones y no se podrá recuperar.",
      )
    )
      return;

    try {
      await apiClient.delete(`/api/users/${id}`);
      alert("✅ Usuario eliminado correctamente");
      router.push("/dashboard/staff");
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      alert("Error al eliminar usuario");
    }
  };

  /**
   * Activa o desactiva el usuario (cambia is_active)
   * Los usuarios inactivos no pueden iniciar sesión
   */
  const toggleActive = async () => {
    try {
      await apiClient.patch(`/api/users/${id}/toggle-active`);
      setUser({ ...user!, is_active: !user!.is_active });
      alert(
        `✅ Usuario ${user!.is_active ? "desactivado" : "activado"} correctamente`,
      );
    } catch (error) {
      console.error("Error al cambiar estado:", error);
      alert("Error al cambiar estado del usuario");
    }
  };

  // ==========================================
  // FUNCIONES AUXILIARES UI
  // ==========================================

  /**
   * Retorna la etiqueta legible del rol
   */
  const getRoleLabel = (role: string) => {
    const roles: Record<string, string> = {
      admin: "Administrador",
      coordinator: "Coordinador",
      technician: "Técnico",
      inspector: "Inspector",
    };
    return roles[role] || role;
  };

  /**
   * Retorna los colores según el rol del usuario
   */
  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: "bg-purple-100 text-purple-700",
      coordinator: "bg-blue-100 text-blue-700",
      technician: "bg-amber-100 text-amber-700",
      inspector: "bg-green-100 text-green-700",
    };
    return colors[role] || "bg-slate-100 text-slate-600";
  };

  /**
   * Retorna los colores según el estado de la asignación
   */
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      assigned: "bg-blue-100 text-blue-700",
      accepted: "bg-cyan-100 text-cyan-700",
      in_progress: "bg-amber-100 text-amber-700",
      completed: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700",
    };
    return colors[status] || "bg-slate-100 text-slate-600";
  };

  /**
   * Retorna la etiqueta legible del estado de asignación
   */
  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      assigned: "Asignado",
      accepted: "Aceptado",
      in_progress: "En Progreso",
      completed: "Completado",
      rejected: "Rechazado",
    };
    return labels[status] || status;
  };

  // ==========================================
  // RENDERIZADO CONDICIONAL
  // ==========================================

  if (loading) {
    return (
      <div className="p-8 bg-slate-50 min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#002B7A] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-8 bg-slate-50 min-h-screen flex items-center justify-center">
        <div className="text-red-500 font-medium">Usuario no encontrado</div>
      </div>
    );
  }

  // ==========================================
  // RENDERIZADO PRINCIPAL
  // ==========================================

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
      {/* ========================================== */}
      {/* HEADER */}
      {/* ========================================== */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Detalle de Personal
          </h1>
          <p className="text-slate-500 font-medium">
            Información completa del usuario del sistema
          </p>
        </div>
        <button
          onClick={() => router.back()}
          className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Volver
        </button>
      </div>

      {/* ========================================== */}
      {/* TARJETA DE INFORMACIÓN DEL USUARIO */}
      {/* ========================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50/50">
          <h3 className="font-bold text-slate-800 text-lg">
            Información del Usuario
          </h3>
        </div>

        <div className="p-6 space-y-6">
          {/* Avatar y datos básicos */}
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-200 overflow-hidden">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="material-symbols-outlined text-5xl text-slate-400">
                  person
                </span>
              )}
            </div>

            {/* Datos personales */}
            <div className="flex-1 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">
                  👤 Nombre completo
                </label>
                <p className="text-lg font-bold text-slate-800">{user.name}</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">
                  📧 Correo electrónico
                </label>
                <p className="text-slate-600">{user.email}</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">
                  🎯 Rol / Cargo
                </label>
                <span
                  className={`text-xs font-bold px-3 py-1.5 rounded-full uppercase inline-block ${getRoleColor(user.role)}`}
                >
                  {getRoleLabel(user.role)}
                </span>
              </div>
            </div>
          </div>

          {/* Datos del sistema */}
          <div className="border-t border-slate-200 pt-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">
                  🆔 ID de usuario
                </label>
                <p className="text-slate-600 font-mono text-sm">{user.id}</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">
                  🔘 Estado
                </label>
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold ${
                    user.is_active
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      user.is_active ? "bg-green-500" : "bg-red-500"
                    }`}
                  ></span>
                  {user.is_active ? "Activo" : "Inactivo"}
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">
                  📅 Fecha de registro
                </label>
                <p className="text-slate-600">
                  {user.created_at
                    ? new Date(user.created_at).toLocaleDateString("es-MX", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "No disponible"}
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">
                  📊 Reportes asignados
                </label>
                <p className="text-2xl font-bold text-slate-800">
                  {user.assignments?.length || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Tabla de reportes asignados (solo para técnicos) */}
          {user.role === "technician" &&
            user.assignments &&
            user.assignments.length > 0 && (
              <div className="border-t border-slate-200 pt-6">
                <h4 className="font-bold text-slate-800 mb-4">
                  📋 Reportes Asignados
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">
                          Reporte
                        </th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">
                          Estado
                        </th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {user.assignments.map((assignment) => (
                        <tr
                          key={assignment.id}
                          className="hover:bg-slate-50/80"
                        >
                          <td className="px-4 py-3 text-sm font-bold text-slate-800">
                            {assignment.report?.report_number ||
                              `Reporte #${assignment.report_id}`}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`text-xs font-bold px-2 py-1 rounded-full ${getStatusColor(assignment.status)}`}
                            >
                              {getStatusLabel(assignment.status)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() =>
                                router.push(
                                  `/dashboard/reports/${assignment.report_id}`,
                                )
                              }
                              className="text-[#002B7A] font-bold text-sm hover:underline flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-sm">
                                visibility
                              </span>
                              Ver reporte
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          {/* Botones de acción */}
          <div className="border-t border-slate-200 pt-6 flex flex-wrap gap-3">
            {/* Resetear contraseña */}
            <button
              onClick={resetPass}
              className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">
                password
              </span>
              Resetear contraseña
            </button>

            {/* Activar/Desactivar usuario */}
            <button
              onClick={toggleActive}
              className={`${
                user.is_active
                  ? "bg-orange-500 hover:bg-orange-600"
                  : "bg-green-500 hover:bg-green-600"
              } text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center gap-2`}
            >
              <span className="material-symbols-outlined text-sm">
                {user.is_active ? "block" : "check_circle"}
              </span>
              {user.is_active ? "Desactivar usuario" : "Activar usuario"}
            </button>

            {/* Eliminar usuario */}
            <button
              onClick={deleteUser}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">delete</span>
              Eliminar usuario
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// NOTAS PARA EL DESPLIEGUE:
// ==========================================
//
// 1. ENDPOINTS UTILIZADOS:
//    - GET /api/users/{id} → Obtener datos del usuario
//    - POST /api/users/{id}/reset-password → Restablecer contraseña
//    - PATCH /api/users/{id}/toggle-active → Activar/desactivar
//    - DELETE /api/users/{id} → Eliminar usuario
//
// 2. PERMISOS REQUERIDOS:
//    - Admin y Coordinator pueden acceder a esta vista
//    - Solo Admin puede eliminar usuarios (validado en backend)
//
// 3. ESTADOS DE USUARIO:
//    - Activo: puede iniciar sesión y usar el sistema
//    - Inactivo: no puede iniciar sesión (conserva datos históricos)
//
// 4. REPORTES ASIGNADOS:
//    - Solo se muestran si el usuario es técnico
//    - Cada reporte tiene link al detalle
//
// ==========================================
