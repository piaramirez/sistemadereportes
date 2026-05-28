"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";

export default function ReportsListPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [filteredReports, setFilteredReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados de control para filtros rápidos
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBuilding, setSelectedBuilding] = useState("todos");
  const [selectedStatus, setSelectedStatus] = useState("todos");

  const API_URL = "http://localhost:8000";

  // Edificios oficiales sembrados en tu init.sql para el filtro rápido
  const buildingsList = [
    "Edificio A1",
    "Edificio A4",
    "Edificio A7",
    "Biblioteca Central",
    "Anexo",
  ];

  useEffect(() => {
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      router.replace("/login");
      return;
    }
    setUser(JSON.parse(userData));

    // Cargar todos los reportes de la API
    axios
      .get(`${API_URL}/api/reports`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (res.data) {
          setReports(res.data);
          setFilteredReports(res.data);
        }
      })
      .catch((err) => console.error("Error al obtener lista de reportes:", err))
      .finally(() => setLoading(false));
  }, [router]);

  // Lógica del motor de filtrado combinado en tiempo real
  useEffect(() => {
    let result = reports;

    // 1. Filtro por buscador de texto (Código o Aula)
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (r) =>
          r.report_number.toLowerCase().includes(term) ||
          r.location.toLowerCase().includes(term),
      );
    }

    // 2. Filtro por Edificio seleccionado
    if (selectedBuilding !== "todos") {
      result = result.filter((r) => r.building === selectedBuilding);
    }

    // 3. Filtro por Estado
    if (selectedStatus !== "todos") {
      result = result.filter(
        (r) => r.status.toLowerCase() == selectedStatus.toLowerCase(),
      );
    }

    setFilteredReports(result);
  }, [searchTerm, selectedBuilding, selectedStatus, reports]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#002B7A] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const isAdmin = user.role?.toLowerCase() === "admin";
  const isEncargado = user.role?.toLowerCase() === "coordinator";

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-900 pb-12">
      {/* CABECERA DE LA PESTAÑA */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 py-4 px-6 sm:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="text-slate-400 hover:text-[#002B7A] transition-colors p-1"
            >
              <span className="material-symbols-outlined text-xl">
                arrow_back
              </span>
            </Link>
            <h2 className="text-xl font-bold text-slate-800">
              Historial Global de Incidencias
            </h2>
          </div>
          <p className="text-xs text-slate-500 pl-8">
            Auditoría completa e inspecciones de higiene de la FES Aragón
          </p>
        </div>

        <button
          onClick={() => router.push("/dashboard/reports/new")}
          className="bg-[#002B7A] hover:bg-[#CDB170] hover:text-[#002B7A] text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          Crear Reporte
        </button>
      </header>

      <main className="max-w-6xl mx-auto mt-6 px-4 space-y-6">
        {/* PANEL DE FILTROS AVANZADOS */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Buscador de barra */}
          <div className="relative">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Buscar por código / aula
            </label>
            <span className="material-symbols-outlined absolute left-3 top-8 text-slate-400 text-lg">
              search
            </span>
            <input
              type="text"
              placeholder="Ej: R-00001 ó Salón 5..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#002B7A] text-slate-800"
            />
          </div>

          {/* Selector de Edificios */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Filtrar por Campus / Edificio
            </label>
            <select
              value={selectedBuilding}
              onChange={(e) => setSelectedBuilding(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-[#002B7A] text-slate-700 font-semibold"
            >
              <option value="todos">🏢 Todos los Edificios</option>
              {buildingsList.map((b, i) => (
                <option key={i} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Selector de Estados */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Estado Operativo
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-[#002B7A] text-slate-700 font-semibold"
            >
              <option value="todos">🔍 Todos los Estados</option>
              <option value="pending">⏳ Acción Pendiente</option>
              <option value="assigned">👤 Asignado</option>
              <option value="completed">✅ Completado</option>
            </select>
          </div>
        </div>

        {/* LISTADO DE REPORTES */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200">
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase">
                    Código
                  </th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase">
                    Ubicación Exacta
                  </th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase">
                    Campus
                  </th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase">
                    Estatus
                  </th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase">
                    Fecha
                  </th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase text-right">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReports.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-sm text-slate-400 italic"
                    >
                      No se encontraron reportes que coincidan con los criterios
                      seleccionados.
                    </td>
                  </tr>
                ) : (
                  filteredReports.map((report) => (
                    <tr
                      key={report.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-black text-[#002B7A]">
                        {report.report_number}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-800">
                        {report.location}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                        {report.building}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
                            report.status === "pending"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : report.status === "completed"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-purple-50 text-purple-700 border-purple-200"
                          }`}
                        >
                          {report.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-400">
                        {report.date}
                      </td>
                      <td className="px-6 py-4 text-right text-sm space-x-1">
                        <button
                          onClick={() =>
                            router.push(`/dashboard/reports/${report.id}`)
                          }
                          className="text-slate-400 hover:text-[#002B7A] p-1 rounded-lg hover:bg-slate-100 transition-all"
                          title="Ver detalle de auditoría"
                        >
                          <span className="material-symbols-outlined text-lg">
                            visibility
                          </span>
                        </button>

                        {(isAdmin || isEncargado) &&
                          report.status !== "completed" && (
                            <button
                              onClick={() =>
                                router.push(
                                  `/dashboard/reports/${String(report.id)}/edit`,
                                )
                              }
                              className="text-amber-500 hover:text-amber-600 p-1 rounded-lg hover:bg-amber-50 transition-all"
                              title="Editar parámetros"
                            >
                              <span className="material-symbols-outlined text-lg">
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
      </main>
    </div>
  );
}
