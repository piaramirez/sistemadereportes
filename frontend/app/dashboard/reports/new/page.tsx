"use client"; // <-- REPARACIÓN AQUÍ: Esta directiva tiene que ser la línea 1 obligatoria

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface UserSelect {
  id: string;
  name: string;
  role: string;
}

export default function NewReport() {
  const router = useRouter();
  const [technicians, setTechnicians] = useState<UserSelect[]>([]);
  const [loading, setLoading] = useState(false);

  // Estado del formulario unificado
  const [formData, setFormData] = useState({
    location_type: "classroom",
    building_name: "Edificio A1",
    classroom_name: "Salón 01",
    comments: "",
    floor_cleaning: "bueno",
    lighting_status: "bueno",
    assigned_to_id: "unassigned",
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Cargar técnicos disponibles al montar el componente
  useEffect(() => {
    // Cargar dinámicamente los iconos por si acaso se usan en el dashboard
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    const token = localStorage.getItem("token");
    fetch("http://localhost:8000/api/users", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data: UserSelect[]) => {
        // Filtrar solo usuarios de soporte técnico
        const techList = data.filter(
          (u) => u.role === "technician" || u.role === "admin",
        );
        setTechnicians(techList);
      })
      .catch((err) => console.error("Error cargando técnicos:", err));
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Error al guardar: Sesión expirada o inválida");
      setLoading(false);
      return;
    }

    const dataToSend = new FormData();
    dataToSend.append("location_type", formData.location_type);
    dataToSend.append("building_name", formData.building_name);
    dataToSend.append("classroom_name", formData.classroom_name);
    dataToSend.append("comments", formData.comments);
    dataToSend.append("floor_cleaning", formData.floor_cleaning);
    dataToSend.append("lighting_status", formData.lighting_status);
    dataToSend.append("assigned_to_id", formData.assigned_to_id);

    if (selectedFile) {
      dataToSend.append("file", selectedFile);
    }

    try {
      const response = await fetch("http://localhost:8000/api/reports", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: dataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error en el servidor Postgres");
      }

      const result = await response.json();
      alert(`¡Reporte ${result.report_number} creado con éxito!`);
      router.push("/dashboard");
    } catch (error: any) {
      alert(`Error al guardar: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 font-sans">
      <div className="max-w-2xl mx-auto">
        {/* Botón de Regresar Profesional */}
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="mb-5 flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#002B7A] transition-colors group cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px] transition-transform group-hover:-translate-x-1">
            arrow_back
          </span>
          Volver al Panel Principal
        </button>

        {/* Contenedor del Formulario */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Encabezado Institucional */}
          <div className="p-6 bg-white border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#002B7A]">
                Levantar Nuevo Reporte
              </h2>
              <p className="text-xs font-bold text-[#CDB170] uppercase tracking-wider mt-0.5">
                Sistema de Monitoreo FES Aragón UNAM
              </p>
            </div>
            <div className="bg-[#002B7A]/5 p-2 rounded-xl">
              <span className="material-symbols-outlined text-[#002B7A] text-2xl block">
                assignment_add
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Infraestructura */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                  Edificio
                </label>
                <input
                  type="text"
                  name="building_name"
                  value={formData.building_name}
                  onChange={handleChange}
                  className="block w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50 text-sm focus:outline-none focus:border-[#002B7A] focus:bg-white transition-all text-slate-800"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                  Ubicación / Salón
                </label>
                <input
                  type="text"
                  name="classroom_name"
                  value={formData.classroom_name}
                  onChange={handleChange}
                  className="block w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50 text-sm focus:outline-none focus:border-[#002B7A] focus:bg-white transition-all text-slate-800"
                  required
                />
              </div>
            </div>

            {/* Tipo de Área */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                Tipo de Espacio
              </label>
              <select
                name="location_type"
                value={formData.location_type}
                onChange={handleChange}
                className="block w-full rounded-xl border border-slate-200 p-2.5 bg-white text-sm focus:outline-none focus:border-[#002B7A] transition-all text-slate-800"
              >
                <option value="classroom">Salón de Clases</option>
                <option value="bathroom">Baños</option>
                <option value="common_area">Área Común</option>
                <option value="lab">Laboratorio</option>
                <option value="office">Oficina</option>
              </select>
            </div>

            {/* Evaluaciones rápidas de infraestructura */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                  Limpieza del Suelo
                </label>
                <select
                  name="floor_cleaning"
                  value={formData.floor_cleaning}
                  onChange={handleChange}
                  className="block w-full rounded-xl border border-slate-200 p-2.5 bg-white text-sm focus:outline-none focus:border-[#002B7A] transition-all text-slate-800"
                >
                  <option value="bueno">Limpio / Adecuado (5★)</option>
                  <option value="malo">Sucio / Requiere Limpieza (1★)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                  Iluminación
                </label>
                <select
                  name="lighting_status"
                  value={formData.lighting_status}
                  onChange={handleChange}
                  className="block w-full rounded-xl border border-slate-200 p-2.5 bg-white text-sm focus:outline-none focus:border-[#002B7A] transition-all text-slate-800"
                >
                  <option value="bueno">Funcional (5★)</option>
                  <option value="malo">Foco Fundido / Sin Luz (1★)</option>
                </select>
              </div>
            </div>

            {/* Asignación Inmediata de Técnico */}
            <div className="border-t border-slate-100 pt-4">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#CDB170]"></span>
                Asignación Inmediata de Personal
              </label>
              <select
                name="assigned_to_id"
                value={formData.assigned_to_id}
                onChange={handleChange}
                className="block w-full rounded-xl border border-[#CDB170]/40 p-2.5 bg-amber-50/20 text-sm focus:outline-none focus:border-[#002B7A] transition-all text-slate-800 font-medium"
              >
                <option value="unassigned">
                  Dejar pendiente (Sin asignar)
                </option>
                {technicians.map((tech) => (
                  <option key={tech.id} value={tech.id}>
                    {tech.name} ({tech.role.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            {/* Comentarios */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                Descripción del Problema
              </label>
              <textarea
                name="comments"
                value={formData.comments}
                onChange={handleChange}
                placeholder="Detalla la incidencia aquí..."
                rows={3}
                className="block w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:outline-none focus:border-[#002B7A] transition-all text-slate-800 placeholder-slate-400"
                required
              />
            </div>

            {/* Subida de Evidencia Fotográfica */}
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-5 text-center hover:bg-slate-50 transition-colors cursor-pointer relative group">
              <label className="cursor-pointer flex flex-col items-center justify-center gap-1">
                <span className="material-symbols-outlined text-slate-400 group-hover:text-[#002B7A] transition-colors text-2xl">
                  add_a_photo
                </span>
                <span className="text-sm font-bold text-[#002B7A] hover:underline mt-1">
                  Cargar evidencia fotográfica
                </span>
                <span className="text-xs text-slate-400">PNG, JPG o JPEG</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              {selectedFile && (
                <div className="mt-3 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-xl font-mono flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">
                    check_circle
                  </span>
                  {selectedFile.name}
                </div>
              )}
            </div>

            {/* Botones de acción */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-[#002B7A] text-white rounded-xl font-bold text-sm hover:bg-[#001F5C] shadow-sm disabled:bg-slate-400 transition-colors cursor-pointer flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Sincronizando...
                  </>
                ) : (
                  "Guardar Reporte"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
