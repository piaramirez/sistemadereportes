"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";

export default function EditReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;

  const [user, setUser] = useState<any>(null);
  const [report, setReport] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Estados del formulario unificados
  const [comments, setComments] = useState("");
  const [status, setStatus] = useState("");
  const [assignedToId, setAssignedToId] = useState("unassigned");
  const [reportDate, setReportDate] = useState(""); // <-- NUEVO: Estado para la Fecha
  const [buildingName, setBuildingName] = useState(""); // <-- NUEVO: Estado para el Edificio (Inmutable/Informativo)
  const [imageFile, setImageFile] = useState<File | null>(null);

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

    const loadFormData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };

        const [reportRes, usersRes] = await Promise.all([
          axios.get(`${API_URL}/api/reports/${id}`, { headers }),
          axios
            .get(`${API_URL}/api/users`, { headers })
            .catch(() => ({ data: [] })),
        ]);

        if (reportRes.data) {
          setReport(reportRes.data);
          setComments(reportRes.data.comments || "");
          setStatus(reportRes.data.status || "pending");
          setAssignedToId(reportRes.data.assigned_to_id || "unassigned");
          setReportDate(reportRes.data.date || ""); // <-- Inyecta la fecha YYYY-MM-DD desde tu backend
          setBuildingName(reportRes.data.building || "FES Aragón"); // <-- Inyecta el edificio de la BD
        }

        if (usersRes.data) {
          setUsersList(usersRes.data);
        }
      } catch (err) {
        console.error("Error al inicializar formulario de edición:", err);
      } finally {
        setLoading(false);
      }
    };

    loadFormData();
  }, [router, id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    setSaving(true);

    try {
      const formData = new FormData();
      formData.append("comments", comments);
      formData.append("status", status);
      formData.append("assigned_to_id", assignedToId);
      formData.append("report_date", reportDate); // <-- NUEVO: Se envía la fecha actualizada al PUT de FastAPI

      if (imageFile) {
        formData.append("file", imageFile); // <-- Asegura el envío del archivo binario de la imagen
      }

      await axios.put(`${API_URL}/api/reports/${id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data", // Permite procesar el archivo e inputs juntos
        },
      });

      router.push(`/dashboard/reports/${id}`);
    } catch (err) {
      console.error("Error al guardar cambios:", err);
      alert("Hubo un error al guardar las modificaciones.");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#002B7A] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const isLocked =
    report && (report.status === "completed" || report.status === "cancelled");

  if (isLocked && !saving) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
        <div className="bg-white p-8 rounded-2xl border border-red-200 shadow-xl max-w-md text-center space-y-4">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <span className="material-symbols-outlined text-3xl font-bold">
              lock
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-800">
            Reporte Inmutable
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            Este reporte se encuentra en estado{" "}
            <span className="font-bold text-red-600 uppercase">
              [{report?.status}]
            </span>
            . Para mantener la integridad del sistema de reportes, las
            incidencias finalizadas o canceladas no pueden modificarse.
          </p>
          <button
            type="button"
            onClick={() => router.push(`/dashboard/reports/${id}`)}
            className="w-full bg-[#002B7A] text-white py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-md flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">
              arrow_back
            </span>
            Regresar al Detalle
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-900 pb-12">
      <nav className="border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link
            href={`/dashboard/reports/${id}`}
            className="p-2 text-slate-400 hover:text-[#002B7A] transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="text-lg font-bold text-slate-800">
            Formulario de Edición —{" "}
            <span className="text-[#002B7A] font-black">
              {report?.report_number}
            </span>
          </h1>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto py-8 px-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* TEXTO INFORMATIVO: EDIFICIO Y UBICACIÓN REAL DE LA BD */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center gap-3">
              <span className="material-symbols-outlined text-[#002B7A] text-2xl">
                corporate_fare
              </span>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Infraestructura FES Aragón
                </p>
                <p className="text-sm font-bold text-slate-800">
                  {buildingName} —{" "}
                  <span className="text-[#002B7A]">
                    {report?.location || "Ubicación General"}
                  </span>
                </p>
              </div>
            </div>

            {/* NUEVO INPUT: FECHA DE INSPECCIÓN */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Fecha de Inspección
              </label>
              <input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="w-full rounded-xl border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:ring-2 focus:ring-[#002B7A] text-gray-800 font-medium outline-none transition-all"
                required
              />
            </div>

            {/* INPUT 1: ESTADO */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Estado de la Incidencia
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-xl border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:ring-2 focus:ring-[#002B7A] text-gray-800 font-medium"
              >
                <option value="pending">⏳ Acción Pendiente (Pending)</option>
                <option value="assigned">👤 Asignado (Assigned)</option>
                <option value="in_progress">
                  ⚙️ En Progreso (In Progress)
                </option>
                <option value="completed">
                  ✅ Completado (Completed - Bloqueará el formulario)
                </option>
                <option value="cancelled">
                  ❌ Cancelado (Cancelled - Bloqueará el formulario)
                </option>
              </select>
            </div>

            {/* INPUT 2: ASIGNACIÓN DE USUARIO */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Asignar Personal Técnico / Coordinador
              </label>
              <select
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
                className="w-full rounded-xl border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:ring-2 focus:ring-[#002B7A] text-gray-800 font-medium"
              >
                <option value="unassigned">
                  ⚠️ Sin asignar (Ubicación General / Guardias)
                </option>
                {usersList.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} — [{u.role.toUpperCase()}]
                  </option>
                ))}
              </select>
            </div>

            {/* INPUT 3: NOTAS DE MANTENIMIENTO */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Notas de Resolución / Descripción Física
              </label>
              <textarea
                rows={4}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Describa a detalle el estado de la infraestructura o la resolución aplicada..."
                className="w-full rounded-xl border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:ring-2 focus:ring-[#002B7A] text-gray-800 focus:ring-2 focus:ring-[#002B7A]"
                required
              />
            </div>

            {/* INPUT 4: SUBIR IMAGEN */}
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 bg-slate-50/50 text-center">
              <span className="material-symbols-outlined text-slate-400 text-3xl block mb-2">
                collections
              </span>
              <label className="block text-sm font-bold text-[#002B7A] cursor-pointer hover:underline mb-1">
                <span>
                  Cargar nueva evidencia fotográfica de infraestructura
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-slate-400">
                Formatos válidos: JPG, PNG • Límite sugerido 5MB
              </p>
              {imageFile && (
                <div className="mt-3 bg-emerald-50 text-emerald-800 text-xs font-bold py-1.5 px-3 rounded-xl inline-flex items-center gap-1.5 border border-emerald-100">
                  <span className="material-symbols-outlined text-sm">
                    check_circle
                  </span>
                  {imageFile.name}
                </div>
              )}
            </div>

            {/* ACCIONES DEL FORMULARIO */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-[#002B7A] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#CDB170] hover:text-[#002A7B] transition-all shadow-md disabled:opacity-50"
              >
                {saving ? "Guardando Cambios..." : "Guardar Modificaciones"}
              </button>
              <Link
                href={`/dashboard/reports/${id}`}
                className="px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold text-sm transition-all text-center"
              >
                Cancelar
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
