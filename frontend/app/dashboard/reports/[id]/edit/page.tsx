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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // --- NUEVOS ESTADOS COMPATIBLES CON CREACIÓN ---
  const [building, setBuilding] = useState("");
  const [location, setLocation] = useState("");
  const [locationType, setLocationType] = useState("classroom");
  const [floorCleaning, setFloorCleaning] = useState("5"); // Se guarda como string de calificación
  const [lightingStatus, setLightingStatus] = useState("5");
  const [comments, setComments] = useState("");
  const [status, setStatus] = useState("pending");
  const [assignedTechId, setAssignedTechId] = useState("unassigned");

  // Gestión de Imágenes/Evidencias
  const [existingImages, setExistingImages] = useState<any[]>([]);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [deleteExistingPhoto, setDeleteExistingPhoto] = useState(false);

  // Catálogos
  const [technicians, setTechnicians] = useState<any[]>([]);

  const API_URL = "http://localhost:8000";

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    const role = parsedUser.role ? parsedUser.role.toLowerCase() : "";

    if (role !== "admin" && role !== "coordinator") {
      alert("Acceso denegado: Tu rol no permite la edición de solicitudes.");
      router.push(`/dashboard/reports/${id}`);
      return;
    }

    setUser(parsedUser);

    const loadData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };

        const [reportRes, usersRes] = await Promise.all([
          axios.get(`${API_URL}/api/reports/${id}`, { headers }),
          axios.get(`${API_URL}/api/users`, { headers }),
        ]);

        if (reportRes.data) {
          const r = reportRes.data;
          setBuilding(r.building || "");
          setLocation(r.location || "");
          setLocationType(r.location_type || "classroom");
          setComments(r.comments || "");
          setStatus(r.status || "pending");
          setAssignedTechId(r.assigned_to_id || "unassigned");
          setExistingImages(r.images || []);

          // Mapear evaluaciones previas si existen en la respuesta del backend
          if (r.floor_cleaning_rating)
            setFloorCleaning(String(r.floor_cleaning_rating));
          if (r.lighting_rating) setLightingStatus(String(r.lighting_rating));
        }

        if (usersRes.data) {
          const techList = usersRes.data.filter(
            (u: any) => u.role.toLowerCase() === "technician",
          );
          setTechnicians(techList);
        }
      } catch (err) {
        console.error("Error cargando los datos de edición:", err);
        alert("No se pudieron recuperar los registros de Postgres.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router, id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setDeleteExistingPhoto(true);
    }
  };

  const handleRemoveExistingPhoto = () => {
    setDeleteExistingPhoto(true);
    setNewFile(null);
    setPreviewUrl(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const token = localStorage.getItem("token");

    try {
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Sincronizar primero el estado operativo mediante el endpoint PUT
      await axios.put(
        `${API_URL}/api/reports/${id}/status`,
        { status },
        { headers },
      );

      // 2. Construir FormData completo con toda la estructura homologada
      const formData = new FormData();
      formData.append("building_name", building);
      formData.append("classroom_name", location);
      formData.append("location_type", locationType);
      formData.append("floor_cleaning", floorCleaning);
      formData.append("lighting_status", lightingStatus);
      formData.append("comments", comments);
      formData.append("assigned_to_id", assignedTechId);
      formData.append("delete_photo", String(deleteExistingPhoto));

      if (newFile) {
        formData.append("file", newFile);
      }

      await axios.patch(`${API_URL}/api/reports/${id}`, formData, {
        headers: {
          ...headers,
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Mantenimiento actualizado de forma exitosa en Postgres.");
      router.push(`/dashboard/reports/${id}`);
      router.refresh();
    } catch (err) {
      console.error("Error al guardar la edición:", err);
      alert("Ocurrió un error interno al guardar en el servidor.");
    } finally {
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

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-900 pb-12">
      <nav className="border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center gap-4">
            <Link
              href={`/dashboard/reports/${id}`}
              className="p-2 text-slate-400 hover:text-[#002B7A] transition-colors"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>
            <h1 className="text-xl font-bold text-slate-800">
              Modificar Reporte <span className="text-[#002B7A]">#{id}</span>
            </h1>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <form
          onSubmit={handleFormSubmit}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6"
        >
          <h2 className="text-sm font-black text-[#002B7A] uppercase tracking-wider border-b pb-2">
            Formulario Oficial de Modificación
          </h2>

          {/* FILA 1: EDIFICIO Y UBICACIÓN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">
                Edificio
              </label>
              <input
                type="text"
                value={building}
                onChange={(e) => setBuilding(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#002B7A] text-slate-800 font-medium"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">
                Ubicación / Salón
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#002B7A] text-slate-800 font-medium"
                required
              />
            </div>
          </div>

          {/* TIPO DE ESPACIO */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">
              Tipo de Espacio
            </label>
            <select
              value={locationType}
              onChange={(e) => setLocationType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#002B7A] text-slate-800"
            >
              <option value="classroom">Salón de Clases</option>
              <option value="bathroom">Sanitarios / Baños</option>
              <option value="laboratory">Laboratorio</option>
              <option value="cubicle">Cubículos Docentes</option>
              <option value="auditorium">
                Auditorio / Sala de Usos Múltiples
              </option>
            </select>
          </div>

          {/* EVALUACIONES DE ESTRELLAS HOMOLOGADAS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">
                Limpieza del Suelo
              </label>
              <select
                value={floorCleaning}
                onChange={(e) => setFloorCleaning(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#002B7A] text-slate-800"
              >
                <option value="5">Limpio / Adecuado (5 ★)</option>
                <option value="3">Regular / Requiere Atención (3 ★)</option>
                <option value="1">Deficiente / Sucio (1 ★)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">
                Iluminación
              </label>
              <select
                value={lightingStatus}
                onChange={(e) => setLightingStatus(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#002B7A] text-slate-800"
              >
                <option value="5">Funcional (5 ★)</option>
                <option value="3">Parcialmente Fundido (3 ★)</option>
                <option value="1">Inoperante / Sin Luz (1 ★)</option>
              </select>
            </div>
          </div>

          {/* CONTROL OPERATIVO Y ASIGNACIÓN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">
                Estado Operativo
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#002B7A] text-slate-800"
              >
                <option value="pending">Acción Pendiente</option>
                <option value="assigned">Asignado al Técnico</option>
                <option value="in_progress">En Curso / Reparación</option>
                <option value="completed">Completado / Atendido</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">
                Asignación de Personal
              </label>
              <select
                value={assignedTechId}
                onChange={(e) => setAssignedTechId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#002B7A] text-slate-800"
              >
                <option value="unassigned">
                  Dejar pendiente (Sin asignar)
                </option>
                {technicians.map((tech) => (
                  <option key={tech.id} value={tech.id}>
                    {tech.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* DESCRIPCIÓN DEL PROBLEMA */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">
              Descripción del Problema
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={4}
              placeholder="Detalla la incidencia aquí..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#002B7A] text-slate-800"
            />
          </div>

          {/* CONTROL FOTOGRÁFICO */}
          <div className="border-t pt-4">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-2">
              Evidencia Fotográfica de Soporte
            </label>

            {!deleteExistingPhoto && existingImages.length > 0 && (
              <div className="relative w-full max-w-xs border rounded-xl overflow-hidden bg-slate-100 mb-4 group">
                <img
                  src={existingImages[0].url}
                  alt="Evidencia actual"
                  className="w-full aspect-video object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemoveExistingPhoto}
                  className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-xl shadow-md transition-colors cursor-pointer"
                  title="Eliminar foto actual"
                >
                  <span className="material-symbols-outlined text-sm font-bold">
                    delete
                  </span>
                </button>
              </div>
            )}

            {previewUrl && (
              <div className="relative w-full max-w-xs border border-amber-300 rounded-xl overflow-hidden bg-slate-100 mb-4">
                <img
                  src={previewUrl}
                  alt="Vista previa"
                  className="w-full aspect-video object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemoveExistingPhoto}
                  className="absolute top-2 right-2 bg-gray-700 text-white p-1.5 rounded-xl shadow-md cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">
                    close
                  </span>
                </button>
              </div>
            )}

            {(deleteExistingPhoto || existingImages.length === 0) &&
              !previewUrl && (
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <span className="material-symbols-outlined text-slate-400 mb-1">
                        add_a_photo
                      </span>
                      <p className="text-xs text-slate-500 font-bold">
                        Cargar evidencia fotográfica
                      </p>
                      <p className="text-[10px] text-slate-400">
                        PNG, JPG o JPEG
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
          </div>

          {/* BOTONES */}
          <div className="flex items-center gap-3 pt-4 border-t">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-[#002B7A] hover:bg-[#001F5C] text-white py-2.5 rounded-xl text-sm font-bold shadow-md transition-all disabled:opacity-50 cursor-pointer text-center"
            >
              {saving ? "Sincronizando..." : "Guardar Reporte"}
            </button>
            <Link
              href={`/dashboard/reports/${id}`}
              className="px-5 py-2.5 border border-slate-300 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-50 transition-all text-center"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
