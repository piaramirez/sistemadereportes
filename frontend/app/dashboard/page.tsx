"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

  const API_URL = "http://localhost:8000";

  useEffect(() => {
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      router.push("/login");
      return;
    }

    setUser(JSON.parse(userData));

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
        console.error("Error al obtener los datos:", error);
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
          Verificando credenciales UNAM...
        </p>
      </div>
    );
  }

  // REGLAS UNAM EN MINÚSCULAS BASADAS EN TU SCHEMA
  const userRole = user.role ? user.role.toLowerCase() : "";
  const isAdmin = userRole === "admin";
  const isEncargado = userRole === "coordinator";
  const isEmpleado = userRole === "technician" || userRole === "inspector";

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
          {(isAdmin || isEncargado) && (
            <a
              className="flex items-center gap-3 px-4 py-2.5 text-slate-600 hover:bg-slate-50 rounded-xl font-medium transition-colors"
              href="#"
            >
              <span className="material-symbols-outlined">group</span> Gestionar
              Personal
            </a>
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

      {/* CONTENIDO */}
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
              {user.initials}
            </div>
          </div>
        </header>

        <div className="p-8 space-y-8 flex-1">
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

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-lg">
                Listado de Reportes de Incidencias
              </h3>
              <button className="bg-[#002B7A] text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2">
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
                        colSpan={6}
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
                          <strong>{report.location}</strong>{" "}
                          <span className="text-xs text-slate-400">
                            ({report.building})
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-bold uppercase">
                            {report.status}
                          </span>
                        </td>
                        {isAdmin && (
                          <td className="px-6 py-4 text-xs font-semibold text-purple-700">
                            ✨ Seguimiento activo
                          </td>
                        )}
                        <td className="px-6 py-4 text-right text-sm space-x-2">
                          <button className="text-slate-400 hover:text-[#002B7A] p-1">
                            <span className="material-symbols-outlined text-[18px]">
                              visibility
                            </span>
                          </button>
                          {(isAdmin || isEncargado) && (
                            <>
                              <button className="text-amber-500 hover:text-amber-600 p-1">
                                <span className="material-symbols-outlined text-[18px]">
                                  edit
                                </span>
                              </button>
                              <button className="text-blue-500 hover:text-blue-600 p-1">
                                <span className="material-symbols-outlined text-[18px]">
                                  assignment_turned_in
                                </span>
                              </button>
                            </>
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
