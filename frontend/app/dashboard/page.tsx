// ==========================================
// ARCHIVO: frontend/app/dashboard/page.tsx
// AUTOR: Pedro Antonio Ramírez Alcántara
// MATERIA: Vinculación Empresarial
// GRUPO: 2007 (2026-II)
// DOCENTE: Aarón Velasco Agustín
// CARRERA: Ingeniería en Computación - FES Aragón
// FUNCIÓN: Panel de control principal - Estadísticas y lista de reportes
// ==========================================

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/axios";

// ==========================================
// INTERFACES / TIPOS
// ==========================================

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface DashboardStats {
  total_reports: number;
  pending: number;
  completed_last_7_days: number;
}

interface Report {
  id: number;
  report_number: string;
  location: string;
  building: string;
  status: string;
  date: string;
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export default function DashboardPage() {
  const router = useRouter();

  // Estados
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    total_reports: 0,
    pending: 0,
    completed_last_7_days: 0,
  });
  const [reports, setReports] = useState<Report[]>([]);

  // ==========================================
  // EFECTOS
  // ==========================================

  useEffect(() => {
    // Agregar fuente de iconos de Material Symbols
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    // Verificar autenticación
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      router.replace("/login");
      return;
    }

    setUser(JSON.parse(userData));

    // Cargar datos del dashboard
    const fetchData = async () => {
      try {
        const [statsRes, reportsRes] = await Promise.all([
          apiClient.get("/api/dashboard/stats"),
          apiClient.get("/api/reports"),
        ]);

        if (statsRes.data) setStats(statsRes.data);
        if (reportsRes.data) setReports(reportsRes.data);
      } catch (error) {
        console.error("Error al cargar datos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  // ==========================================
  // FUNCIONES DE ACCIONES
  // ==========================================

  /**
   * Cierra la sesión del usuario actual
   */
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  /**
   * Retorna los estilos según el estado del reporte
   */
  const getStatusStyles = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-amber-50 text-amber-700";
      case "assigned":
        return "bg-purple-50 text-purple-700";
      case "in_progress":
        return "bg-blue-50 text-blue-700";
      case "completed":
        return "bg-emerald-50 text-emerald-700";
      case "cancelled":
        return "bg-red-50 text-red-700";
      default:
        return "bg-slate-50 text-slate-700";
    }
  };

  /**
   * Retorna la etiqueta legible del estado
   */
  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "⏳ Pendiente",
      assigned: "👤 Asignado",
      in_progress: "🔄 En Progreso",
      completed: "✅ Completado",
      cancelled: "❌ Cancelado",
    };
    return labels[status.toLowerCase()] || status;
  };

  // ==========================================
  // RENDERIZADO CONDICIONAL
  // ==========================================

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#002B7A] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const userRole = user.role?.toLowerCase() || "";
  const isAdmin = userRole === "admin";
  const isEncargado = userRole === "coordinator";
  const isEmpleado = userRole === "technician" || userRole === "inspector";

  // ==========================================
  // RENDERIZADO PRINCIPAL
  // ==========================================

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans">
      {/* ========================================== */}
      {/* SIDEBAR (MENÚ LATERAL) */}
      {/* ========================================== */}
      <aside className="w-64 flex-shrink-0 hidden lg:flex flex-col border-r border-slate-200 bg-white">
        {/* Logo */}
        <div className="p-5 flex items-center gap-3 border-b border-slate-100">
          <div className="bg-[#002B7A] p-2 rounded-xl text-white">
            <span className="material-symbols-outlined">domain</span>
          </div>
          <div>
            <h1 className="font-bold text-lg text-[#002B7A]">EduInspect</h1>
            <p className="text-[10px] text-[#CDB170] font-bold uppercase">
              FES Aragón UNAM
            </p>
          </div>
        </div>

        {/* Navegación */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          <button className="flex items-center gap-3 w-full px-4 py-2.5 text-[#002B7A] bg-[#F1E9D7] rounded-xl font-bold">
            <span className="material-symbols-outlined">dashboard</span>
            Panel Principal
          </button>

          <button
            onClick={() => router.push("/dashboard/reports")}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-slate-600 hover:bg-slate-50 rounded-xl font-medium text-left transition-colors"
          >
            <span className="material-symbols-outlined">description</span>
            Reportes
          </button>

          <button
            onClick={() => router.push("/dashboard/messages")}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-slate-600 hover:bg-slate-50 rounded-xl font-medium text-left transition-colors"
          >
            <span className="material-symbols-outlined">forum</span>
            Mensajes
          </button>

          {(isAdmin || isEncargado) && (
            <button
              onClick={() => router.push("/dashboard/staff")}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-slate-600 hover:bg-slate-50 rounded-xl font-medium text-left transition-colors"
            >
              <span className="material-symbols-outlined">group</span>
              Gestionar Personal
            </button>
          )}
        </nav>

        {/* Botón de logout */}
        <div className="p-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-xl font-semibold transition-colors"
          >
            <span className="material-symbols-outlined">logout</span>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* ========================================== */}
      {/* CONTENIDO PRINCIPAL */}
      {/* ========================================== */}
      <main className="flex-1 overflow-y-auto flex flex-col">
        {/* Header */}
        <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-slate-800">
            Panel de Control (
            {user.role === "admin"
              ? "Administrador"
              : user.role === "coordinator"
                ? "Coordinador"
                : user.role === "technician"
                  ? "Técnico"
                  : "Inspector"}
            )
          </h2>
          <div className="text-right">
            <p className="text-sm font-bold text-slate-800">{user.name}</p>
            <p className="text-xs font-semibold text-[#CDB170] uppercase">
              {user.role}
            </p>
          </div>
        </header>

        {/* Contenido */}
        <div className="p-8 space-y-8">
          {/* Tarjetas de estadísticas (solo para admin y coordinator) */}
          {!isEmpleado && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Total de reportes */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-slate-500">
                    Total de Reportes
                  </p>
                  <span className="material-symbols-outlined text-slate-400">
                    description
                  </span>
                </div>
                <h3 className="text-3xl font-black text-slate-800">
                  {stats.total_reports}
                </h3>
              </div>

              {/* Pendientes */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-slate-500">
                    Pendientes
                  </p>
                  <span className="material-symbols-outlined text-amber-500">
                    pending
                  </span>
                </div>
                <h3 className="text-3xl font-black text-amber-600">
                  {stats.pending}
                </h3>
              </div>

              {/* Atendidos (7 días) */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-slate-500">
                    Atendidos (7 días)
                  </p>
                  <span className="material-symbols-outlined text-emerald-500">
                    check_circle
                  </span>
                </div>
                <h3 className="text-3xl font-black text-emerald-600">
                  {stats.completed_last_7_days}
                </h3>
              </div>
            </div>
          )}

          {/* Tabla de reportes recientes */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-lg">
                📋 Listado de Reportes de Incidencias
              </h3>
              <button
                onClick={() => router.push("/dashboard/reports")}
                className="bg-[#002B7A] text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-[#001F5C] transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                Crear Reporte
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">
                      REPORTE
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">
                      UBICACIÓN
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">
                      ESTADO
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">
                      ACCIONES
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reports.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-12 text-center text-sm text-slate-400 italic"
                      >
                        No hay reportes registrados
                      </td>
                    </tr>
                  ) : (
                    reports.map((report) => (
                      <tr
                        key={report.id}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        <td className="px-6 py-4 text-sm font-bold text-[#002B7A]">
                          {report.report_number}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700">
                          {report.location}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`text-xs font-bold px-2 py-1 rounded-full ${getStatusStyles(report.status)}`}
                          >
                            {getStatusLabel(report.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() =>
                              router.push(`/dashboard/reports/${report.id}`)
                            }
                            className="text-slate-400 hover:text-[#002B7A] transition-colors p-1 rounded-lg hover:bg-slate-100"
                            title="Ver detalle"
                          >
                            <span className="material-symbols-outlined">
                              visibility
                            </span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Resumen */}
            <div className="p-4 border-t border-slate-200 bg-slate-50/30 text-right text-xs text-slate-400">
              Mostrando {reports.length} reportes recientes
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ==========================================
// NOTAS PARA EL DESPLIEGUE:
// ==========================================
//
// 1. ENDPOINTS UTILIZADOS:
//    - GET /api/dashboard/stats → Estadísticas del dashboard
//    - GET /api/reports → Lista de reportes recientes
//
// 2. ROLES Y PERMISOS:
//    - Admin: Ve todas las tarjetas de estadísticas
//    - Coordinator: Ve todas las tarjetas de estadísticas
//    - Technician/Inspector: Solo ven la tabla de reportes
//
// 3. SIDEBAR:
//    - Los técnicos e inspectores NO ven "Gestionar Personal"
//    - Solo admin y coordinator tienen acceso completo
//
// 4. ESTADOS DE REPORTES:
//    - pending: ⏳ Pendiente
//    - assigned: 👤 Asignado
//    - in_progress: 🔄 En Progreso
//    - completed: ✅ Completado
//    - cancelled: ❌ Cancelado
//
// ==========================================
