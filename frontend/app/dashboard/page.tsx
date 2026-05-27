"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import axios from "axios";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>({
    total_reports: 0,
    pending: 0,
    completed_last_7_days: 0,
  });
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Configuramos la URL base apuntando a tu FastAPI en Docker
  const API_URL = "http://localhost:8000";

  useEffect(() => {
    // 1. Cargar fuentes de Google Material Symbols directamente si no están en el layout global
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    // 2. Validar sesión
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    // Intentamos recuperar datos del usuario o usamos datos por defecto basados en tu token
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      setUser({ name: "Pedro Ramírez", role: "admin", initials: "PR" });
    }

    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };

        // Peticiones reales a tu FastAPI dockerizado
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
        console.error("Error cargando los datos del dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#002B7A] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-semibold text-[#002B7A]">
          Cargando Sistema UNAM...
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans">
      {/* 1. SIDEBAR LATERAL - Adaptado 100% de la maqueta a colores UNAM */}
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
            <span className="material-symbols-outlined">dashboard</span>
            Panel Principal
          </a>
          <a
            className="flex items-center gap-3 px-4 py-2.5 text-slate-600 hover:bg-slate-50 rounded-xl font-medium transition-colors"
            href="#"
          >
            <span className="material-symbols-outlined">description</span>
            Reportes
          </a>
          <a
            className="flex items-center gap-3 px-4 py-2.5 text-slate-600 hover:bg-slate-50 rounded-xl font-medium transition-colors"
            href="#"
          >
            <span className="material-symbols-outlined">corporate_fare</span>
            Edificios
          </a>
          <a
            className="flex items-center gap-3 px-4 py-2.5 text-slate-600 hover:bg-slate-50 rounded-xl font-medium transition-colors"
            href="#"
          >
            <span className="material-symbols-outlined">group</span>
            Personal
          </a>
        </nav>

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

      {/* 2. CONTENIDO PRINCIPAL */}
      <main className="flex-1 overflow-y-auto flex flex-col">
        {/* HEADER SUPERIOR */}
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              Panel de Control de Reportes
            </h2>
            <p className="text-sm text-slate-500">
              Monitoreo de mantenimiento escolar y reportes de higiene
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-400 hover:text-[#002B7A] transition-colors">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>

            {/* Información del perfil */}
            <div className="flex items-center gap-3 border-l pl-4 border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-800">{user.name}</p>
                <p className="text-xs font-semibold text-[#CDB170] uppercase tracking-wider">
                  {user.role}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#002B7A] text-white font-bold flex items-center justify-center text-sm border-2 border-[#CDB170] shadow-sm">
                {user.initials || "U"}
              </div>
            </div>
          </div>
        </header>

        {/* CONTAINER GENERAL */}
        <div className="p-8 space-y-8 flex-1">
          {/* CARDS DE INDICADORES (Mapeados dinámicamente con los estados de tu API) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Reportes */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-500">
                    Total de Reportes
                  </p>
                  <h3 className="text-3xl font-black text-slate-800 mt-1">
                    {stats.total_reports || reports.length || 0}
                  </h3>
                </div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                  <span className="material-symbols-outlined">assignment</span>
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs font-bold text-[#002B7A]">
                <span className="material-symbols-outlined text-[14px] mr-1">
                  sync
                </span>
                <span>Sincronizado con Postgres</span>
              </div>
            </div>

            {/* Pendientes */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-500">
                    Acciones Pendientes
                  </p>
                  <h3 className="text-3xl font-black text-amber-600 mt-1">
                    {stats.pending ||
                      reports.filter((r) => r.status === "pending").length ||
                      0}
                  </h3>
                </div>
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                  <span className="material-symbols-outlined">
                    pending_actions
                  </span>
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs font-bold text-amber-600">
                <span className="material-symbols-outlined text-[14px] mr-1">
                  priority_high
                </span>
                <span>Requieren atención inmediata</span>
              </div>
            </div>

            {/* Atendidos */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-500">
                    Atendidos Recientemente
                  </p>
                  <h3 className="text-3xl font-black text-emerald-600 mt-1">
                    {stats.completed_last_7_days ||
                      reports.filter((r) => r.status === "completed").length ||
                      0}
                  </h3>
                </div>
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                  <span className="material-symbols-outlined">task_alt</span>
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs font-bold text-slate-400">
                <span>Últimas actualizaciones</span>
              </div>
            </div>
          </div>

          {/* TABLA DE REPORTES */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Filtros superiores de la maqueta */}
            <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
              <div className="flex flex-wrap items-center gap-3">
                <select className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-[#002B7A] focus:border-transparent text-gray-700">
                  <option>Todas las Ubicaciones</option>
                  <option>Aulas</option>
                  <option>Baños</option>
                  <option>Áreas Comunes</option>
                </select>
                <select className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-[#002B7A] focus:border-transparent text-gray-700">
                  <option>Todos los Estados</option>
                  <option>Atendido</option>
                  <option>Pendiente</option>
                </select>
              </div>

              <button className="bg-[#002B7A] hover:bg-[#CDB170] hover:text-[#002B7A] text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-sm">
                <span className="material-symbols-outlined text-[18px]">
                  add
                </span>
                Nuevo Reporte
              </button>
            </div>

            {/* Estructura de la tabla mapeada */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Reporte
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Reportero
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Ubicación
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reports.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-12 text-center text-sm text-slate-400 font-medium"
                      >
                        No hay reportes cargados en este momento.
                      </td>
                    </tr>
                  ) : (
                    reports.map((report) => (
                      <tr
                        key={report.id}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-[#002B7A]">
                          {report.report_number || `#${report.id}`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-[#F1E9D7] text-[#002B7A] flex items-center justify-center text-[10px] font-black">
                              {(report.reporter_name || "U")
                                .substring(0, 2)
                                .toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-slate-700">
                              {report.reporter_name || "Usuario UNAM"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-800 font-medium">
                            {report.location || "Ubicación General"}
                          </div>
                          <div className="text-xs text-slate-400">
                            {report.building || "Campus Central"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold
                            ${report.status === "pending" ? "bg-amber-50 text-amber-700 border border-amber-200" : ""}
                            ${report.status === "completed" || report.status === "atendido" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : ""}
                            ${report.status === "in_progress" ? "bg-blue-50 text-blue-700 border border-blue-200" : ""}
                          `}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full 
                              ${report.status === "pending" ? "bg-amber-500" : ""}
                              ${report.status === "completed" || report.status === "atendido" ? "bg-emerald-500" : ""}
                              ${report.status === "in_progress" ? "bg-blue-500" : ""}
                            `}
                            ></span>
                            {report.status === "pending"
                              ? "Pendiente"
                              : report.status === "completed" ||
                                  report.status === "atendido"
                                ? "Atendido"
                                : report.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">
                          {report.date ||
                            new Date(report.created_at).toLocaleDateString(
                              "es-MX",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <button className="text-slate-400 hover:text-[#002B7A] transition-colors">
                            <span className="material-symbols-outlined text-[20px]">
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

            {/* Paginación */}
            <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50/30">
              <p className="text-sm text-slate-500">
                Mostrando 1 a {reports.length} de {reports.length} reportes
              </p>
              <div className="flex items-center gap-2">
                <button
                  className="px-3 py-1 border border-slate-200 rounded-lg text-sm bg-white disabled:opacity-50"
                  disabled
                >
                  Anterior
                </button>
                <button className="px-3 py-1 bg-[#002B7A] text-white rounded-lg text-sm font-bold">
                  1
                </button>
                <button
                  className="px-3 py-1 border border-slate-200 rounded-lg text-sm bg-white disabled:opacity-50"
                  disabled
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
