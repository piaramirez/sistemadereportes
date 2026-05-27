"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const userData = localStorage.getItem("user");
    if (userData) setUser(JSON.parse(userData));

    const fetchData = async () => {
      try {
        const [statsRes, reportsRes] = await Promise.all([
          axios.get("/api/dashboard/stats", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("/api/reports", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setStats(statsRes.data);
        setReports(reportsRes.data);
      } catch (error) {
        console.error("Error:", error);
      }
    };

    fetchData();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  if (!user) return <div className="p-8">Cargando...</div>;

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b px-8 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-primary">EduInspect</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm">
            {user.name} ({user.role})
          </span>
          <button onClick={handleLogout} className="text-red-500 text-sm">
            Salir
          </button>
        </div>
      </header>

      <main className="p-8">
        <h2 className="text-2xl font-bold mb-6">Panel de Control</h2>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <p className="text-slate-500 text-sm">Total Reportes</p>
              <p className="text-3xl font-bold">{stats.total_reports}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <p className="text-slate-500 text-sm">Pendientes</p>
              <p className="text-3xl font-bold text-amber-600">
                {stats.pending}
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <p className="text-slate-500 text-sm">Completados</p>
              <p className="text-3xl font-bold text-green-600">
                {stats.completed_last_7_days}
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <p className="text-slate-500 text-sm">Tiempo promedio</p>
              <p className="text-3xl font-bold">{stats.avg_response_time}h</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500">
                  Reporte
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500">
                  Ubicación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500">
                  Fecha
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3 font-medium">
                    {report.report_number}
                  </td>
                  <td className="px-6 py-3">{report.location}</td>
                  <td className="px-6 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium
                      ${report.status === "pending" ? "bg-amber-100 text-amber-700" : ""}
                      ${report.status === "completed" ? "bg-green-100 text-green-700" : ""}
                      ${report.status === "in_progress" ? "bg-blue-100 text-blue-700" : ""}
                    `}
                    >
                      {report.status}
                    </span>
                  </td>
                  <td className="px-6 py-3">{report.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
