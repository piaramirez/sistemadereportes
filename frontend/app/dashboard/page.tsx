"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Estados necesarios para que las tablas y tarjetas no tiren error de "undefined"
  const [stats, setStats] = useState<any>({
    total_reports: 0,
    pending: 0,
    completed_last_7_days: 0,
  });
  const [reports, setReports] = useState<any[]>([]);

  const API_URL = "http://localhost:8000";

  useEffect(() => {
    // Cargar los iconos de Google de forma dinámica
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    // Si no existen credenciales, directo al login
    if (!token || !userData) {
      router.replace("/login");
      return;
    }

    // Parseamos el usuario real
    setUser(JSON.parse(userData));

    // Consumir los datos del backend dockerizado de FastAPI
    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [statsRes, reportsRes] = await Promise.all([
          axios
            .get(`${API_URL}/api/dashboard/stats`, { headers })
            .catch(() => ({ data: null })),
          axios
            .get(`${API_URL}/api/reports`, { headers })
            .catch(() => ({ data: [] })),
        ]);

        if (statsRes.data) setStats(statsRes.data);
        if (reportsRes.data) setReports(reportsRes.data);
      } catch (error) {
        console.error("Error al obtener los datos del Dashboard:", error);
      } finally {
        // <-- CORREGIDO DEFINITIVAMENTE: Cambio de 'bits' por 'finally'
        setLoading(false); // Apagamos el cargador inmediatamente al terminar las peticiones
      }
    };

    fetchData();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  // 1. PANTALLA DE CARGA: Se ejecuta de forma limpia mientras loading sea true
  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white font-sans gap-4">
        <div className="w-12 h-12 border-4 border-[#CDB170] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-bold tracking-wider animate-pulse text-slate-300">
          Verificando credenciales UNAM...
        </p>
      </div>
    );
  }

  // 2. REGLAS UNAM EN MINÚSCULAS
  const userRole = user.role ? user.role.toLowerCase() : "";
  const isAdmin = userRole === "admin";
  const isEncargado = userRole === "coordinator";
  const isEmpleado = userRole === "technician" || userRole === "inspector";

  // 3. RENDERIZADO DEL DASHBOARD COMPLETO
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans">
      {/* SIDEBAR */}
      <aside className="w-64 flex-shrink-0 hidden lg:flex flex-col border-r border-slate-200 bg-white">
        <div className="p-5 flex items-center gap-3 border-b border-slate-100">
          <div className="bg-[#002B7A] p-2 rounded-xl flex items-center justify-center shadow-md">
            <span className="material-symbols-outlined text-white text-xl">
              domain
            </span>
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight text-[#002B7A]">
              EduInspect
            </h1>
            <p className="text-[10px] text-[#CDB170] font-bold uppercase tracking-wider">
              FES Aragón UNAM
            </p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          <a
            className="flex items-center gap-3 px-4 py-2.5 text-[#002B7A] bg-[#F1E9D7] rounded-xl font-bold transition-all"
            href="#"
          >
            <span className="material-symbols-outlined">dashboard</span> Panel
            Principal
          </a>
          <a
            className="flex items-center gap-3 px-4 py-2.5 text-slate-600 hover:bg-slate-50 rounded-xl font-medium transition-colors"
            href="#"
          >
            <span className="material-symbols-outlined">description</span>{" "}
            Reportes
          </a>
          {!isEmpleado && (
            <a
              className="flex items-center gap-3 px-4 py-2.5 text-slate-600 hover:bg-slate-50 rounded-xl font-medium transition-colors"
              href="#"
            >
              <span className="material-symbols-outlined">corporate_fare</span>{" "}
              Edificios
            </a>
          )}

          {/* REGLA: SÓLO EL ADMINISTRADOR Y EL ENCARGADO VEN LA SECCIÓN DE GESTIÓN DE PERSONAL */}
          {(isAdmin || isEncargado) && (
            <Link
              className="flex items-center gap-3 px-4 py-2.5 text-slate-600 hover:bg-slate-50 rounded-xl font-medium transition-colors"
              href="/dashboard/users"
            >
              <span className="material-symbols-outlined">group</span> Gestionar
              Personal
            </Link>
          )}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-xl font-semibold transition-colors"
          >
            <span className="material-symbols-outlined">logout</span> Cerrar
            Sesión
          </button>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 overflow-y-auto flex flex-col">
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              Panel de Control ({user.role})
            </h2>
            <p className="text-sm text-slate-500">
              Monitoreo de mantenimiento escolar e higiene
            </p>
          </div>
          <div className="flex items-center gap-3 border-l pl-4 border-slate-200">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-800">{user.name}</p>
              <p className="text-xs font-semibold text-[#CDB170] uppercase tracking-wider">
                {user.role}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#002B7A] text-white font-bold flex items-center justify-center text-sm border-2 border-[#CDB170]">
              {user.initials || "U"}
            </div>
          </div>
        </header>

        <div className="p-8 space-y-8 flex-1">
          {/* TARJETAS DE INDICADORES */}
          {!isEmpleado && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-sm font-semibold text-slate-500">
                  Total de Reportes
                </p>
                <h3 className="text-3xl font-black text-slate-800 mt-1">
                  {stats.total_reports || reports.length}
                </h3>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-sm font-semibold text-slate-500">
                  Pendientes
                </p>
                <h3 className="text-3xl font-black text-amber-600 mt-1">
                  {stats.pending ||
                    reports.filter((r) => r.status === "pending").length}
                </h3>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-sm font-semibold text-slate-500">
                  Atendidos (7 días)
                </p>
                <h3 className="text-3xl font-black text-emerald-600 mt-1">
                  {stats.completed_last_7_days || 0}
                </h3>
              </div>
            </div>
          )}

          {/* TABLA DE INCIDENCIAS */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-lg">
                Listado de Reportes de Incidencias
              </h3>

              {/* ACCIÓN: BOTÓN TOTALMENTE HABILITADO Y ENRUTADO */}
              <button
                onClick={() => router.push("/dashboard/reports/new")}
                className="bg-[#002B7A] hover:bg-[#CDB170] hover:text-[#002B7A] text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">
                  add
                </span>
                {isEmpleado ? "Abrir Nuevo Reporte" : "Crear Reporte"}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Reporte
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Ubicación
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Estado
                    </th>
                    {isAdmin && (
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Seguimientos (Admin)
                      </th>
                    )}
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reports.length === 0 ? (
                    <tr>
                      <td
                        colSpan={isAdmin ? 5 : 4}
                        className="px-6 py-8 text-center text-sm text-slate-400 font-medium"
                      >
                        No hay incidencias registradas en la base de datos.
                      </td>
                    </tr>
                  ) : (
                    reports.map((report) => (
                      <tr
                        key={report.id}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm font-bold text-[#002B7A]">
                          {report.report_number || `#${report.id}`}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700">
                          <strong>
                            {report.location?.name ||
                              report.location ||
                              "Salón sin asignar"}
                          </strong>{" "}
                          <span className="text-xs text-slate-400">
                            (
                            {report.location?.building?.name ||
                              report.building ||
                              "FES Aragón"}
                            )
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`text-xs font-bold uppercase px-2 py-1 rounded-full ${
                              report.status === "pending"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : report.status === "completed"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {report.status}
                          </span>
                        </td>

                        {isAdmin && (
                          <td className="px-6 py-4 text-xs font-semibold text-purple-700">
                            ✨ Seguimiento activo
                          </td>
                        )}

                        <td className="px-6 py-4 text-right text-sm space-x-1 print:hidden">
                          {/* BOTÓN 1: VISUALIZAR REPORTE */}
                          <button
                            onClick={() =>
                              router.push(`/dashboard/reports/${report.id}`)
                            }
                            className="text-slate-400 hover:text-[#002B7A] p-1.5 hover:bg-slate-100 rounded-lg transition-all"
                            title="Ver detalle del reporte"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              visibility
                            </span>
                          </button>

                          {/* BOTÓN 2: EDITAR REPORTE (OCULTO SI EL STATUS ES COMPLETED) */}
                          {(isAdmin || isEncargado) &&
                            report.status !== "completed" && (
                              <button
                                onClick={() =>
                                  router.push(
                                    `/dashboard/reports/${String(report.id)}/edit`,
                                  )
                                }
                                className="text-amber-500 hover:text-amber-600 p-1.5 hover:bg-amber-50 rounded-lg transition-all"
                                title="Editar datos del reporte"
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  edit
                                </span>
                              </button>
                            )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
