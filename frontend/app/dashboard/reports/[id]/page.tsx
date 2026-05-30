// ==========================================
// ARCHIVO: frontend/app/dashboard/reports/[id]/page.tsx
// AUTOR: Pedro Antonio Ramírez Alcántara
// MATERIA: Vinculación Empresarial
// GRUPO: 2007 (2026-II)
// DOCENTE: Aarón Velasco Agustín
// CARRERA: Ingeniería en Computación - FES Aragón
// FUNCIÓN: Página de detalle de un reporte - Chat, imágenes, estado
// ==========================================

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import apiClient from "@/lib/axios";

// ==========================================
// INTERFACES / TIPOS
// ==========================================

interface Image {
  url: string;
  caption: string;
}

interface ChatComment {
  id: number;
  user_name: string;
  user_role: string;
  comment: string;
  created_at: string;
}

interface ReportDetail {
  id: string;
  report_number: string;
  reporter_name: string;
  date: string;
  date_formatted: string;
  location_type: string;
  location: string;
  building: string;
  status: string;
  comments: string;
  assigned_technician: string;
  assigned_to_id?: string;
  floor_cleaning_rating?: number;
  lighting_rating?: number;
  images: Image[];
  chat_comments?: ChatComment[];
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export default function ReportDetailPage({
  params,
}: Readonly<{
  params: { id: string };
}>) {
  const router = useRouter();
  const { id } = params; // ✅ CORREGIDO - Acceso directo, sin use()

  // ==========================================
  // ESTADOS
  // ==========================================

  const [user, setUser] = useState<any>(null);
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [comments, setComments] = useState<ChatComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Modal de eliminación
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ==========================================
  // EFECTOS
  // ==========================================

  useEffect(() => {
    // Agregar fuente de iconos de Material
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    // Verificar autenticación
    if (!token || !userData) {
      router.push("/login");
      return;
    }

    setUser(JSON.parse(userData));

    const fetchReportData = async () => {
      try {
        const reportRes = await apiClient.get(`/api/reports/${id}`);

        if (reportRes && reportRes.data) {
          setReport(reportRes.data);
          // Los comentarios vienen incluidos en la respuesta
          if (reportRes.data.chat_comments) {
            setComments(reportRes.data.chat_comments);
          }
        } else {
          // Fallback si no hay datos
          setReport({
            id: id,
            report_number: `R-${id.padStart(5, "0")}`,
            reporter_name: "Inspector UNAM",
            date_formatted: "Sin fecha",
            date: "",
            location_type: "classroom",
            location: "Ubicación General",
            building: "FES Aragón",
            status: "pending",
            comments: "No se pudieron cargar los datos del reporte.",
            assigned_technician: "Sin técnico asignado",
            images: [],
            chat_comments: [],
          });
        }
      } catch (error) {
        console.error("Error al cargar el detalle", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [router, id]);

  // ==========================================
  // FUNCIONES DE ACCIONES
  // ==========================================

  /**
   * Marca el reporte como completado/atendido
   * Solo accesible para admin y coordinator
   */
  const handleMarkAsCompleted = async () => {
    setUpdatingStatus(true);

    try {
      await apiClient.put(`/api/reports/${id}/status`, { status: "completed" });
      setReport((prev) => (prev ? { ...prev, status: "completed" } : null));
    } catch (err) {
      console.error("No se pudo cambiar el estado:", err);
      alert("Error al intentar actualizar el estado del reporte.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  /**
   * Elimina permanentemente el reporte
   * Solo accesible para admin (y solo si no está completado)
   */
  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      await apiClient.delete(`/api/reports/${id}`);
      setShowDeleteModal(false);
      router.push("/dashboard");
    } catch (err) {
      console.error("Error al eliminar el reporte:", err);
      alert("No se pudo borrar el reporte de la base de datos.");
    } finally {
      setDeleting(false);
    }
  };

  /**
   * Envía un nuevo comentario al reporte
   * Se usa optimistic update para mejor UX
   */
  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    // Optimistic update - mostrar el comentario inmediatamente
    const freshComment: ChatComment = {
      id: comments.length + 1,
      user_name: user.name,
      user_role: user.role,
      comment: newComment,
      created_at: "Enviando...",
    };

    setComments([...comments, freshComment]);
    const commentText = newComment;
    setNewComment("");

    try {
      const res = await apiClient.post(`/api/reports/${id}/comments`, {
        comment: commentText,
      });

      // Actualizar el comentario con la respuesta real del backend
      if (res.data && res.data.comment) {
        setComments((prev) =>
          prev.map((c) =>
            c.comment === commentText && c.created_at === "Enviando..."
              ? {
                  ...c,
                  id: res.data.comment.id,
                  created_at: res.data.comment.created_at,
                }
              : c,
          ),
        );
      }
    } catch (err) {
      console.error("Error guardando comentario:", err);
      alert("No se pudo sincronizar el comentario con el backend.");
      // Remover el comentario optimista si falló
      setComments((prev) => prev.filter((c) => c.comment !== commentText));
    }
  };

  /**
   * Exporta el reporte como PDF (usando print)
   */
  const handleExportPDF = () => {
    alert("Generando PDF oficial de la FES Aragón...");
    window.print();
  };

  // ==========================================
  // RENDERIZADO CONDICIONAL
  // ==========================================

  if (loading || !report) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#002B7A] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // ==========================================
  // PERMISOS Y VARIABLES AUXILIARES
  // ==========================================

  const userRole = user.role ? user.role.toLowerCase() : "";
  const isAdmin = userRole === "admin";
  const isEncargado = userRole === "coordinator";
  const isCompleted = report.status === "completed";

  // Evaluaciones visuales (para la UI)
  const getFloorCleaningDisplay = (rating?: number) => {
    if (!rating)
      return { text: "No evaluado", color: "text-gray-500", icon: "help" };
    if (rating <= 2)
      return { text: "Deficiente", color: "text-red-600", icon: "cancel" };
    if (rating <= 4)
      return { text: "Regular", color: "text-amber-600", icon: "warning" };
    return { text: "Bueno", color: "text-emerald-600", icon: "check_circle" };
  };

  const getLightingDisplay = (rating?: number) => {
    if (!rating)
      return { text: "No evaluado", color: "text-gray-500", icon: "help" };
    if (rating <= 2)
      return { text: "Inoperante", color: "text-red-600", icon: "cancel" };
    if (rating <= 4)
      return { text: "Parcial", color: "text-amber-600", icon: "warning" };
    return {
      text: "Funcional",
      color: "text-emerald-600",
      icon: "check_circle",
    };
  };

  const floorDisplay = getFloorCleaningDisplay(report.floor_cleaning_rating);
  const lightDisplay = getLightingDisplay(report.lighting_rating);

  // ==========================================
  // RENDERIZADO PRINCIPAL
  // ==========================================

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-900 pb-12 relative">
      {/* ========================================== */}
      {/* NAVBAR (oculto en impresión) */}
      {/* ========================================== */}
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
                className="flex items-center gap-2 px-3.5 py-2 border border-slate-300 rounded-xl text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 transition-all shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm text-[#002B7A]">
                  picture_as_pdf
                </span>
                Exportar PDF
              </button>

              {!isCompleted && (
                <Link
                  href={`/dashboard/reports/${id}/edit`}
                  className="flex items-center gap-2 px-3.5 py-2 border border-amber-300 rounded-xl text-sm font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 transition-all shadow-sm"
                >
                  <span className="material-symbols-outlined text-sm">
                    edit
                  </span>
                  Editar
                </Link>
              )}

              {/* Eliminar: solo admin Y reporte NO completado */}
              {isAdmin && !isCompleted && (
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="flex items-center gap-2 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">
                    delete
                  </span>
                  Eliminar
                </button>
              )}

              {/* Marcar como atendido: admin/coord Y NO completado */}
              {(isAdmin || isEncargado) && !isCompleted && (
                <button
                  onClick={handleMarkAsCompleted}
                  disabled={updatingStatus}
                  className="flex items-center gap-2 px-4 py-2 bg-[#002B7A] hover:bg-[#CDB170] text-white hover:text-[#002B7A] rounded-xl text-sm font-bold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
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

      {/* ========================================== */}
      {/* CONTENIDO PRINCIPAL */}
      {/* ========================================== */}
      <main className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* COLUMNA IZQUIERDA - Detalles del reporte */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tarjeta principal */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between mb-3">
                  {isCompleted ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase">
                      ✅ Completado
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 uppercase">
                      ⚠️ Acción Pendiente
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
                {/* Grid de información */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      👤 Nombre del Reportero
                    </label>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {report.reporter_name}
                    </p>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      📅 Fecha del Reporte
                    </label>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {report.date_formatted || report.date}
                    </p>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      🏫 Tipo de Ubicación
                    </label>
                    <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                      <span className="material-symbols-outlined text-[#002B7A] text-lg">
                        school
                      </span>
                      {report.location_type === "classroom"
                        ? "Salón de Clases"
                        : report.location_type}
                    </p>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      📍 Edificio / Aula
                    </label>
                    <p className="mt-1 text-sm font-bold text-[#002B7A]">
                      {report.building}, {report.location}
                    </p>
                  </div>

                  <div className="sm:col-span-2 pt-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      🔧 Personal Encargado de Reparación
                    </label>
                    <p className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1.5 rounded-xl inline-flex items-center gap-1.5 border border-purple-100">
                      <span className="material-symbols-outlined text-sm">
                        engineering
                      </span>
                      {report.assigned_technician || "Sin técnico asignado"}
                    </p>
                  </div>
                </div>

                {/* Evaluaciones */}
                <div className="mt-8">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-3">
                    📋 Lista de Evaluación Física
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/60">
                      <span className="text-sm font-medium text-slate-700">
                        Limpieza del Suelo
                      </span>
                      <span
                        className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md border ${floorDisplay.color === "text-red-600" ? "bg-red-50 border-red-100 text-red-600" : floorDisplay.color === "text-emerald-600" ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-gray-50 border-gray-100 text-gray-600"}`}
                      >
                        <span className="material-symbols-outlined text-sm">
                          {floorDisplay.icon}
                        </span>
                        {floorDisplay.text}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/60">
                      <span className="text-sm font-medium text-slate-700">
                        Funcionalidad de Iluminación
                      </span>
                      <span
                        className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md border ${lightDisplay.color === "text-red-600" ? "bg-red-50 border-red-100 text-red-600" : lightDisplay.color === "text-emerald-600" ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-gray-50 border-gray-100 text-gray-600"}`}
                      >
                        <span className="material-symbols-outlined text-sm">
                          {lightDisplay.icon}
                        </span>
                        {lightDisplay.text}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Descripción */}
                <div className="mt-8">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    📝 Descripción Inicial del Problema
                  </label>
                  <div className="mt-2 p-4 bg-[#F1E9D7]/40 rounded-xl text-sm leading-relaxed border-l-4 border-l-[#CDB170] text-slate-700 italic">
                    "{report.comments}"
                  </div>
                </div>
              </div>
            </div>

            {/* Galería de imágenes */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2 text-slate-700">
                <span className="material-symbols-outlined text-slate-400">
                  photo_library
                </span>
                📸 Evidencias Fotográficas Almacenadas
              </h3>

              {!report.images || report.images.length === 0 ? (
                <div className="text-xs text-slate-400 italic bg-slate-50 p-4 rounded-xl text-center border border-dashed">
                  No se han subido archivos de imagen para esta incidencia.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {report.images.map((img, idx) => (
                    <div
                      key={idx}
                      className="group border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-slate-50 cursor-pointer"
                      onClick={() => window.open(img.url, "_blank")}
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

          {/* COLUMNA DERECHA - Chat / Bitácora */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[480px]">
              <div className="p-4 bg-slate-50 border-b border-slate-200">
                <h3 className="font-bold text-sm text-[#002B7A] flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">
                    forum
                  </span>
                  💬 Bitácora de Seguimiento
                </h3>
              </div>

              {/* Lista de comentarios */}
              <div className="p-4 flex-1 overflow-y-auto space-y-4 bg-slate-50/30">
                {comments.length === 0 ? (
                  <div className="text-center text-slate-400 text-sm py-8">
                    No hay comentarios aún. Sé el primero en comentar.
                  </div>
                ) : (
                  comments.map((comment, index) => (
                    <div
                      key={comment.id || index}
                      className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm space-y-1"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-[#002B7A]">
                          {comment.user_name}
                        </span>
                        <span className="text-[10px] text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded font-bold uppercase">
                          {comment.user_role}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 leading-snug">
                        {comment.comment}
                      </p>
                      <p className="text-[9px] text-slate-400 text-right font-medium">
                        {comment.created_at}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Input para nuevo comentario */}
              <form
                onSubmit={handleSendComment}
                className="p-3 border-t border-slate-200 bg-white flex gap-2 items-center"
              >
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Escribe un avance o instrucción..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#002B7A] focus:border-transparent text-slate-800"
                />
                <button
                  type="submit"
                  className="bg-[#002B7A] hover:bg-[#CDB170] text-white hover:text-[#002B7A] p-2 rounded-xl transition-all flex items-center justify-center shadow-sm cursor-pointer"
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

      {/* ========================================== */}
      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      {/* ========================================== */}
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
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-all shadow-md disabled:opacity-50 cursor-pointer"
              >
                {deleting ? "Eliminando..." : "Confirmar Eliminación"}
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-all text-center cursor-pointer"
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