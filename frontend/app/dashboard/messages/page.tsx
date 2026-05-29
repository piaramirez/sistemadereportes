"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

interface Notification {
  id: number;
  user_id: string;
  report_id: number;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
  report?: {
    id: number;
    report_number: string;
    status: string;
    location?: {
      name: string;
    };
  };
}

interface Comment {
  id: number;
  report_id: number;
  user_id: string;
  comment: string;
  created_at: string;
  user?: {
    id: string;
    name: string;
    role: string;
    avatar_url?: string;
  };
}

export default function MessagesPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [activeTab, setActiveTab] = useState<"notifications" | "comments">(
    "notifications",
  );
  const [loading, setLoading] = useState(true);
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    const token = localStorage.getItem("token");
    try {
      const [notifRes, commentsRes] = await Promise.all([
        axios.get("http://localhost:8000/api/notifications", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("http://localhost:8000/api/comments", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setNotifications(notifRes.data);
      setComments(commentsRes.data);
    } catch (error) {
      console.error("Error al cargar mensajes:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notifId: number) => {
    const token = localStorage.getItem("token");
    try {
      await axios.patch(
        `http://localhost:8000/api/notifications/${notifId}/read`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setNotifications(
        notifications.map((n) =>
          n.id === notifId ? { ...n, is_read: true } : n,
        ),
      );
    } catch (error) {
      console.error("Error al marcar como leído:", error);
    }
  };

  const markAllAsRead = async () => {
    const token = localStorage.getItem("token");
    try {
      await axios.post(
        `http://localhost:8000/api/notifications/mark-all-read`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setNotifications(notifications.map((n) => ({ ...n, is_read: true })));
      alert("Todos los mensajes marcados como leídos");
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const postComment = async (reportId: number) => {
    if (!newComment.trim()) return;

    const token = localStorage.getItem("token");
    try {
      const res = await axios.post(
        `http://localhost:8000/api/reports/${reportId}/comments`,
        { comment: newComment },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setComments([res.data, ...comments]);
      setNewComment("");
      setSelectedReportId(null);
      alert("Comentario agregado");
    } catch (error) {
      console.error("Error al enviar comentario:", error);
      alert("Error al enviar comentario");
    }
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      assignment: "assignment",
      status_change: "published_with_changes",
      comment: "chat",
      due_date: "schedule",
    };
    return icons[type] || "notifications";
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      assignment: "bg-blue-100 text-blue-700",
      status_change: "bg-amber-100 text-amber-700",
      comment: "bg-green-100 text-green-700",
      due_date: "bg-red-100 text-red-700",
    };
    return colors[type] || "bg-slate-100 text-slate-700";
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      assignment: "Asignación",
      status_change: "Cambio de estado",
      comment: "Comentario",
      due_date: "Fecha límite",
    };
    return labels[type] || type;
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (loading) {
    return (
      <div className="p-8 bg-slate-50 min-h-screen flex items-center justify-center">
        <div className="text-slate-500 font-medium">Cargando mensajes...</div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Mensajes</h1>
        <p className="text-slate-500 font-medium">
          Comentarios y notificaciones del sistema
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("notifications")}
          className={`px-6 py-3 font-bold text-sm transition-colors ${
            activeTab === "notifications"
              ? "text-[#002B7A] border-b-2 border-[#002B7A]"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Notificaciones
          {unreadCount > 0 && (
            <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
              {unreadCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("comments")}
          className={`px-6 py-3 font-bold text-sm transition-colors ${
            activeTab === "comments"
              ? "text-[#002B7A] border-b-2 border-[#002B7A]"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Comentarios
        </button>
      </div>

      {/* Contenido */}
      <div className="space-y-4">
        {/* Notificaciones */}
        {activeTab === "notifications" && (
          <>
            {notifications.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
                <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">
                  notifications_off
                </span>
                <p className="text-slate-500">No hay notificaciones</p>
              </div>
            ) : (
              <>
                {unreadCount > 0 && (
                  <div className="flex justify-end">
                    <button
                      onClick={markAllAsRead}
                      className="text-sm text-[#002B7A] font-bold hover:underline"
                    >
                      Marcar todas como leídas
                    </button>
                  </div>
                )}
                <div className="space-y-3">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`bg-white rounded-2xl border shadow-sm p-5 transition-all hover:shadow-md cursor-pointer ${
                        notif.is_read
                          ? "border-slate-200"
                          : "border-l-4 border-l-[#002B7A]"
                      }`}
                      onClick={() => {
                        if (!notif.is_read) markAsRead(notif.id);
                        if (notif.report_id) {
                          router.push(`/dashboard/reports/${notif.report_id}`);
                        }
                      }}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`p-2 rounded-xl ${getTypeColor(notif.type)}`}
                        >
                          <span className="material-symbols-outlined text-xl">
                            {getTypeIcon(notif.type)}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`text-xs font-bold px-2 py-0.5 rounded-full ${getTypeColor(notif.type)}`}
                            >
                              {getTypeLabel(notif.type)}
                            </span>
                            <span className="text-xs text-slate-400">
                              {new Date(notif.created_at).toLocaleString(
                                "es-MX",
                              )}
                            </span>
                          </div>
                          <p className="text-slate-700">{notif.message}</p>
                          {notif.report && (
                            <p className="text-sm text-slate-500 mt-2">
                              Reporte: {notif.report.report_number}
                            </p>
                          )}
                        </div>
                        {!notif.is_read && (
                          <div className="w-2 h-2 bg-[#002B7A] rounded-full"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* Comentarios */}
        {activeTab === "comments" && (
          <>
            {comments.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
                <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">
                  chat
                </span>
                <p className="text-slate-500">No hay comentarios aún</p>
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center overflow-hidden">
                        {comment.user?.avatar_url ? (
                          <img
                            src={comment.user.avatar_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="material-symbols-outlined text-slate-400">
                            person
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="font-bold text-slate-800">
                            {comment.user?.name || "Usuario"}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            {comment.user?.role || "User"}
                          </span>
                          <span className="text-xs text-slate-400">
                            {new Date(comment.created_at).toLocaleString(
                              "es-MX",
                            )}
                          </span>
                        </div>
                        <p className="text-slate-700 mb-2">{comment.comment}</p>
                        <button
                          onClick={() =>
                            router.push(
                              `/dashboard/reports/${comment.report_id}`,
                            )
                          }
                          className="text-sm text-[#002B7A] font-bold hover:underline"
                        >
                          Ver reporte →
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal para agregar comentario (flotante) */}
      {selectedReportId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full">
            <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-lg">
                Agregar Comentario
              </h3>
              <button
                onClick={() => setSelectedReportId(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <textarea
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#002B7A] text-slate-800"
                rows={4}
                placeholder="Escribe tu comentario..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedReportId(null)}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => postComment(selectedReportId)}
                  className="flex-1 bg-[#002B7A] text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-[#001F5C]"
                >
                  Enviar comentario
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
