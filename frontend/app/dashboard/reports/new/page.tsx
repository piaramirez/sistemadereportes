"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";

export default function NewReportPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Estados del formulario
  const [locationType, setLocationType] = useState("classroom");
  const [building, setBuilding] = useState("Edificio A4");
  const [classroom, setClassroom] = useState("");
  const [comments, setComments] = useState("");
  const [assignedToId, setAssignedToId] = useState("unassigned");
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Estados de evaluación física
  const [floorCleaning, setFloorCleaning] = useState("bueno");
  const [lightingStatus, setLightingStatus] = useState("bueno");

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

    // Cargar la lista de técnicos desde Postgres
    axios
      .get(`${API_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (res.data) setUsersList(res.data);
      })
      .catch((err) => console.error("Error cargando personal:", err));
  }, [router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classroom.trim()) {
      alert("Por favor, especifique el aula o salón.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Sesión inválida.");
      router.push("/login");
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("location_type", locationType);
      formData.append("building_name", building);
      formData.append("classroom_name", classroom);
      formData.append("comments", comments);
      formData.append("floor_cleaning", floorCleaning);
      formData.append("lighting_status", lightingStatus);
      formData.append("assigned_to_id", assignedToId);

      if (imageFile) {
        formData.append("file", imageFile);
      }

      // CORRECCIÓN CLAVE: Pasamos el header de autorización limpio.
      // Dejamos que Axios configure de manera automática los boundaries de multipart/form-data.
      await axios.post(`${API_URL}/api/reports`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      router.push("/dashboard");
    } catch (err: any) {
      console.error("Error al levantar el reporte:", err.response?.data || err);
      alert(
        `Error al guardar: ${err.response?.data?.detail || "Error de red o sesión"}`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#002B7A] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-900 pb-12">
      <nav className="border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="p-2 text-slate-400 hover:text-[#002B7A] transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="text-lg font-bold text-slate-800">
            Levantar Nueva Solicitud de Mantenimiento (Modo Admin)
          </h1>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto py-8 px-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* UBICACIÓN */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Tipo de Área
                </label>
                <select
                  value={locationType}
                  onChange={(e) => setLocationType(e.target.value)}
                  className="w-full rounded-xl border-slate-300 bg-slate-50 px-3 py-2 text-sm text-gray-800 font-medium"
                >
                  <option value="classroom">Aulas / Salones</option>
                  <option value="laboratory">Laboratorios</option>
                  <option value="auditorium">Auditorios</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Edificio
                </label>
                <select
                  value={building}
                  onChange={(e) => setBuilding(e.target.value)}
                  className="w-full rounded-xl border-slate-300 bg-slate-50 px-3 py-2 text-sm text-gray-800 font-medium"
                >
                  <option value="Edificio A1">Edificio A1</option>
                  <option value="Edificio A4">Edificio A4</option>
                  <option value="Edificio A7">Edificio A7</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Aula / Salón
                </label>
                <input
                  type="text"
                  placeholder="Ej: Salón 5"
                  value={classroom}
                  onChange={(e) => setClassroom(e.target.value)}
                  className="w-full rounded-xl border-slate-300 bg-slate-50 px-3 py-2 text-sm text-gray-800 font-medium outline-none"
                  required
                />
              </div>
            </div>

            {/* EVALUACIONES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border bg-slate-50/50 flex flex-col gap-2">
                <span className="text-sm font-bold text-slate-700">
                  Limpieza del Suelo
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFloorCleaning("bueno")}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${floorCleaning === "bueno" ? "bg-emerald-50 text-emerald-700 border-emerald-300" : "bg-white text-slate-500"}`}
                  >
                    Bueno
                  </button>
                  <button
                    type="button"
                    onClick={() => setFloorCleaning("deficiente")}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${floorCleaning === "deficiente" ? "bg-red-50 text-red-700 border-red-300" : "bg-white text-slate-500"}`}
                  >
                    Deficiente
                  </button>
                </div>
              </div>
              <div className="p-4 rounded-xl border bg-slate-50/50 flex flex-col gap-2">
                <span className="text-sm font-bold text-slate-700">
                  Iluminación
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setLightingStatus("bueno")}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${lightingStatus === "bueno" ? "bg-emerald-50 text-emerald-700 border-emerald-300" : "bg-white text-slate-500"}`}
                  >
                    Bueno
                  </button>
                  <button
                    type="button"
                    onClick={() => setLightingStatus("deficiente")}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${lightingStatus === "deficiente" ? "bg-red-50 text-red-700 border-red-300" : "bg-white text-slate-500"}`}
                  >
                    Deficiente
                  </button>
                </div>
              </div>
            </div>

            {/* BOX DE ASIGNACIÓN DIRECTA */}
            <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/30">
              <label className="block text-xs font-bold text-purple-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">
                  engineering
                </span>
                Asignación Inmediata de Personal (Privilegio Admin)
              </label>
              <select
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
                className="w-full rounded-xl border-purple-300 bg-white px-3 py-2.5 text-sm text-purple-900 font-bold outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="unassigned">
                  ⚠️ Guardar como Pendiente (Sin asignar técnico aún)
                </option>
                {usersList.map((u) => (
                  <option key={u.id} value={u.id}>
                    👤 {u.name} ({u.role.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            {/* DESCRIPCIÓN */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Descripción del Problema
              </label>
              <textarea
                rows={3}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Detalles observados..."
                className="w-full rounded-xl border-slate-300 bg-slate-50 px-3 py-2 text-sm text-gray-800"
                required
              />
            </div>

            {/* FOTO */}
            <div className="border-2 border-dashed rounded-2xl p-6 bg-slate-50/50 text-center">
              <span className="material-symbols-outlined text-slate-400 text-2xl block mb-1">
                add_a_photo
              </span>
              <label className="block text-sm font-bold text-[#002B7A] cursor-pointer hover:underline">
                <span>Cargar evidencia fotográfica</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              {imageFile && (
                <div className="mt-2 bg-emerald-50 text-emerald-800 text-xs font-bold py-1 px-2 rounded-xl inline-block border border-emerald-100">
                  {imageFile.name}
                </div>
              )}
            </div>

            {/* ACCIONES */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-[#002B7A] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#CDB170] hover:text-[#002A7B] transition-all disabled:opacity-50"
              >
                {submitting
                  ? "Sincronizando con Postgres..."
                  : "Guardar y Publicar Reporte"}
              </button>
              <Link
                href="/dashboard"
                className="px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold text-sm flex items-center justify-center"
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
