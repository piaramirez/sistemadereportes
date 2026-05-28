"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";

export default function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;

  const [user, setUser] = useState<any>(null);
  const [report, setReport] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Control del modal estético de eliminación institucional
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

    const fetchReportData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };

        const [reportRes, commentsRes] = await Promise.all([
          axios
            .get(`${API_URL}/api/reports/${id}`, { headers })
            .catch(() => null),
          axios
            .get(`${API_URL}/api/reports/${id}/comments`, { headers })
            .catch(() => null),
        ]);

        if (reportRes && reportRes.data) {
          setReport(reportRes.data);
        } else {
          setReport({
            id: id,
            report_number: `R-${id.padStart(5, "0")}`,
            reporter_name: "Inspector UNAM",
            date_formatted: "Sin fecha",
            location_type: "classroom",
            location: "Ubicación General",
            building: "FES Aragón",
            status: "pending",
            comments:
              "No se pudieron cargar los datos del reporte desde la API.",
            assigned_technician: "Sin técnico asignado",
            images: [],
          });
        }

        if (commentsRes && commentsRes.data) {
          setComments(commentsRes.data);
        }
      } catch (error) {
        console.error("Error al cargar el detalle", error);
      } finally {
        // <-- ARREGLADO DEFINITIVAMENTE: Cambio de 'bits' por 'finally'
        setLoading(false);
      }
    };

    fetchReportData();
  }, [router, id]);

  const handleMarkAsCompleted = async () => {
    const token = localStorage.getItem("token");
    setUpdatingStatus(true);

    try {
      await axios.put(
        `${API_URL}/api/reports/${id}/status`,
        { status: "completed" },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setReport((prev: any) => ({ ...prev, status: "completed" }));
    } catch (err) {
      console.error("No se pudo cambiar el estado del reporte:", err);
      alert("Error al intentar actualizar el estado del reporte.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/api/reports/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowDeleteModal(false);
      router.push("/dashboard");
    } catch (err) {
      console.error("Error al eliminar el reporte:", err);
      alert("No se pudo borrar el reporte de la base de datos.");
    } finally {
      setDeleting(false);
    }
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const token = localStorage.getItem("token");
    const freshComment = {
      id: comments.length + 1,
      user: user.name,
      role: user.role,
      text: newComment,
      date: "Ahora mismo",
    };
    setComments([...comments, freshComment]);
    const commentTextTemp = newComment;
    setNewComment("");

    try {
      await axios.post(
        `${API_URL}/api/reports/${id}/comments`,
        { text: commentTextTemp },
        { headers: { Authorization: `Bearer ${token}` } },
      );
    } catch (err) {
      console.error("Error guardando el comentario:", err);
    }
  };

  const handleExportPDF = () => {
    alert("Generando PDF oficial de la FES Aragón...");
    window.print();
  };

  if (loading || !report) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#002B7A] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const userRole = user.role ? user.role.toLowerCase() : "";
  const isAdmin = userRole === "admin";
  const isEncargado = userRole === "coordinator";
  const isCompleted = report.status === "completed";

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-900 pb-12 relative">
      {/* NAVBAR */}
      <nav className="border-b border-slate-200 bg-white sticky top-0 z-10 print:hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="p-2 text-slate-400 hover:text-[#002B7A] transition-colors"
              >
                <span className="material-symbols-outlined">arrow_back</span>
              </Link>
              <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                Reporte{" "}
                <span className="text-[#002B7A] font-black">
                  {report.report_number}
                </span>
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-2 px-3.5 py-2 border border-slate-300 rounded-xl text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-sm text-[#002B7A]">
                  picture_as_pdf
                </span>
                Exportar PDF
              </button>

              {!isCompleted && (
                <Link
                  href={`/dashboard/reports/${String(id)}/edit`} // <-- Forzamos el ID como string limpio
                  className="flex items-center gap-2 px-3.5 py-2 border border-amber-300 rounded-xl text-sm font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 transition-all shadow-sm"
                >
                  <span className="material-symbols-outlined text-sm">
                    edit
                  </span>
                  Editar
                </Link>
              )}0

              {/* BOTÓN ELIMINAR ACTUALIZADO */}
              {isAdmin && (
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="flex items-center gap-2 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all"
                >
                  <span className="material-symbols-outlined text-sm">
                    delete
                  </span>
                  Eliminar
                </button>
              )}

              {(isAdmin || isEncargado) && !isCompleted && (
                <button
                  onClick={handleMarkAsCompleted}
                  disabled={updatingStatus}
                  className="flex items-center gap-2 px-4 py-2 bg-[#002B7A] hover:bg-[#CDB170] text-white hover:text-[#002B7A] rounded-xl text-sm font-bold shadow-sm transition-all disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-sm">
                    {updatingStatus ? "sync" : "check_circle"}
                  </span>
                  {updatingStatus ? "Actualizando..." : "Marcar Atendido"}
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* DETALLES */}
      <main className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between mb-3">
                  {isCompleted ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase">
                      Completado
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 uppercase">
                      Acción Pendiente
                    </span>
                  )}
                  <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                    <span className="material-symbols-outlined text-sm">
                      history
                    </span>
                    Sincronizado con Postgres
                  </span>
                </div>
                <h2 className="text-lg font-black text-[#002B7A]">
                  Detalles de la Solicitud de Mantenimiento
                </h2>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Nombre del Reportero
                    </label>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {report.reporter_name}
                    </p>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Fecha del Reporte
                    </label>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {report.date_formatted || report.date}
                    </p>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Tipo de Ubicación
                    </label>
                    <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                      <span className="material-symbols-outlined text-[#002B7A] text-lg">
                        school
                      </span>
                      {report.location_type === "classroom"
                        ? "Aulas"
                        : report.location_type}
                    </p>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Edificio / Aula
                    </label>
                    <p className="mt-1 text-sm font-bold text-[#002B7A]">
                      {report.building}, {report.location}
                    </p>
                  </div>

                  <div className="sm:col-span-2 pt-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Personal Encargado de Reparación
                    </label>
                    <p className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1.5 rounded-xl inline-flex items-center gap-1.5 border border-purple-100">
                      <span className="material-symbols-outlined text-sm">
                        engineering
                      </span>
                      {report.assigned_technician || "Sin técnico asignado"}
                    </p>
                  </div>
                </div>

                <div className="mt-8">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-3">
                    Lista de Evaluación Física
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/60">
                      <span className="text-sm font-medium text-slate-700">
                        Limpieza del Suelo
                      </span>
                      <span className="text-red-600 flex items-center gap-1 text-xs font-bold bg-red-50 px-2 py-0.5 rounded-md border border-red-100">
                        <span className="material-symbols-outlined text-sm">
                          cancel
                        </span>{" "}
                        Deficiente
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/60">
                      <span className="text-sm font-medium text-slate-700">
                        Funcionalidad de Iluminación
                      </span>
                      <span className="text-emerald-600 flex items-center gap-1 text-xs font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                        <span className="material-symbols-outlined text-sm">
                          check_circle
                        </span>{" "}
                        Bueno
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Descripción Inicial del Problema
                  </label>
                  <div className="mt-2 p-4 bg-[#F1E9D7]/40 rounded-xl text-sm leading-relaxed border-l-4 border-l-[#CDB170] text-slate-700 italic">
                    "{report.comments}"
                  </div>
                </div>
              </div>
            </div>

            {/* FOTOS */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2 text-slate-700">
                <span className="material-symbols-outlined text-slate-400">
                  photo_library
                </span>
                Evidencias Fotográficas Almacenadas
              </h3>

              {!report.images || report.images.length === 0 ? (
                <div className="text-xs text-slate-400 italic bg-slate-50 p-4 rounded-xl text-center border border-dashed">
                  No se han subido archivos de imagen para esta incidencia
                  todavía.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {report.images.map((img: any, idx: number) => (
                    <div
                      key={idx}
                      className="group border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-slate-50"
                    >
                      <img
                        src={img.url}
                        alt={img.caption || "Evidencia"}
                        className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* CHAT */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-120">
              <div className="p-4 bg-slate-50 border-b border-slate-200">
                <h3 className="font-bold text-sm text-[#002B7A] flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">
                    forum
                  </span>
                  Bitácora de Seguimiento (Chat)
                </h3>
              </div>

              <div className="p-4 flex-1 overflow-y-auto space-y-4 bg-slate-50/30">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="bg-white p-3 rounded-xl border border-slate-150 shadow-sm space-y-1"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-[#002B7A]">
                        {comment.user}
                      </span>
                      <span className="text-[10px] text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded font-bold uppercase">
                        {comment.role}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 leading-snug">
                      {comment.text}
                    </p>
                    <p className="text-[9px] text-slate-400 text-right font-medium">
                      {comment.date}
                    </p>
                  </div>
                ))}
              </div>

              <form
                onSubmit={handleSendComment}
                className="p-3 border-t border-slate-200 bg-white flex gap-2 items-center"
              >
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Escribe un avance o instrucción..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#002B7A] focus:border-transparent text-gray-800"
                />
                <button
                  type="submit"
                  className="bg-[#002B7A] hover:bg-[#CDB170] text-white hover:text-[#002B7A] p-2 rounded-xl transition-all flex items-center justify-center shadow-sm"
                >
                  <span className="material-symbols-outlined text-sm font-bold">
                    send
                  </span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* ========================================================== */}
      {/* 🚀 MODAL INSTITUCIONAL DE CONFIRMACIÓN EN TAILWIND (SÚPER LIMPIO) */}
      {/* ========================================================== */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in print:hidden">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden p-6 space-y-4">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center shadow-inner">
              <span className="material-symbols-outlined text-2xl font-bold">
                warning
              </span>
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-800">
                ¿Está seguro de eliminar este registro?
              </h3>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                Esta acción es irreversible. Se eliminará permanentemente la
                incidencia{" "}
                <span className="font-bold text-[#002B7A]">
                  {report?.report_number}
                </span>{" "}
                del sistema y se removerán los datos físicos de la base de datos
                de auditoría.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-all shadow-md disabled:opacity-50"
              >
                {deleting ? "Eliminando..." : "Confirmar Eliminación"}
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-all text-center"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
