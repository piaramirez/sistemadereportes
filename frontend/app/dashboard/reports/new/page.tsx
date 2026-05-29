// ==========================================
// ARCHIVO: frontend/app/dashboard/reports/new/page.tsx
// AUTOR: Pedro Antonio Ramírez Alcántara
// MATERIA: Vinculación Empresarial
// GRUPO: 2007 (2026-II)
// DOCENTE: Aarón Velasco Agustín
// CARRERA: Ingeniería en Computación - FES Aragón
// FUNCIÓN: Creación de nuevos reportes de incidencia
// ==========================================

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/axios";

// ==========================================
// INTERFACES / TIPOS
// ==========================================

interface Technician {
  id: string;
  name: string;
  role: string;
}

// ==========================================
// CONSTANTES
// ==========================================

const EDIFICIOS = [
  "Edificio A1",
  "Edificio A2",
  "Edificio A3",
  "Edificio A4",
  "Edificio A5",
  "Edificio A6",
  "Edificio A7",
  "Edificio A8",
  "Biblioteca Central",
  "Idiomas",
  "Anexo",
  "Canchas Deportivas",
  "Gimnasio",
  "Áreas Comunes y Jardineras",
  "Estacionamiento",
];

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export default function NewReportPage() {
  const router = useRouter();

  // Estados
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Datos del formulario
  const [formData, setFormData] = useState({
    location_type: "classroom",
    building_name: "Edificio A1",
    classroom_name: "Salón 01",
    comments: "",
    floor_cleaning: "bueno",
    lighting_status: "bueno",
    assigned_to_id: "unassigned",
  });

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

    // Cargar técnicos disponibles
    const fetchTechnicians = async () => {
      try {
        const res = await apiClient.get("/api/users");
        const data = res.data;
        // Filtrar solo técnicos (y admin también pueden recibir asignaciones)
        const techList = data.filter(
          (u: Technician) => u.role === "technician" || u.role === "admin",
        );
        setTechnicians(techList);
      } catch (err) {
        console.error("Error cargando técnicos:", err);
      }
    };

    fetchTechnicians();
  }, []);

  // ==========================================
  // MANEJADORES DE EVENTOS
  // ==========================================

  /**
   * Maneja cambios en los campos del formulario
   */
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  /**
   * Maneja la selección de archivo de imagen
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Validar tamaño máximo (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("❌ El archivo no puede superar los 5MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  /**
   * Envía el formulario para crear un nuevo reporte
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const token = localStorage.getItem("token");
    if (!token) {
      alert("❌ Sesión expirada. Por favor, inicia sesión nuevamente.");
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
      const response = await apiClient.post("/api/reports", dataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data && response.data.report_number) {
        alert(`✅ ¡Reporte ${response.data.report_number} creado con éxito!`);
        router.push("/dashboard");
      } else {
        alert("✅ Reporte creado con éxito");
        router.push("/dashboard");
      }
    } catch (error: any) {
      console.error("Error al crear reporte:", error);
      const errorMsg = error.response?.data?.detail || "Error al crear reporte";
      alert(`❌ Error al guardar: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // RENDERIZADO PRINCIPAL
  // ==========================================

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 font-sans">
      <div className="max-w-2xl mx-auto">
        {/* ========================================== */}
        {/* BOTÓN VOLVER */}
        {/* ========================================== */}
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

        {/* ========================================== */}
        {/* FORMULARIO */}
        {/* ========================================== */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Encabezado */}
          <div className="p-6 bg-white border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#002B7A]">
                📋 Levantar Nuevo Reporte
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
            {/* ========================================== */}
            {/* UBICACIÓN */}
            {/* ========================================== */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Edificio */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                  🏫 Edificio
                </label>
                <select
                  name="building_name"
                  value={formData.building_name}
                  onChange={handleChange}
                  className="block w-full rounded-xl border border-slate-200 p-2.5 bg-white text-sm focus:outline-none focus:border-[#002B7A] focus:ring-1 focus:ring-[#002B7A] transition-all text-slate-800"
                  required
                >
                  {EDIFICIOS.map((edificio) => (
                    <option key={edificio} value={edificio}>
                      {edificio}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ubicación / Salón */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                  📍 Ubicación / Salón
                </label>
                <input
                  type="text"
                  name="classroom_name"
                  value={formData.classroom_name}
                  onChange={handleChange}
                  placeholder="Ej: Salón 101, Laboratorio 3, etc."
                  className="block w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50 text-sm focus:outline-none focus:border-[#002B7A] focus:bg-white transition-all text-slate-800"
                  required
                />
              </div>
            </div>

            {/* Tipo de Área */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                🏷️ Tipo de Espacio
              </label>
              <select
                name="location_type"
                value={formData.location_type}
                onChange={handleChange}
                className="block w-full rounded-xl border border-slate-200 p-2.5 bg-white text-sm focus:outline-none focus:border-[#002B7A] focus:ring-1 focus:ring-[#002B7A] transition-all text-slate-800"
              >
                <option value="classroom">📚 Salón de Clases</option>
                <option value="bathroom">🚽 Baños</option>
                <option value="common_area">🌳 Área Común</option>
                <option value="lab">🔬 Laboratorio</option>
                <option value="office">💼 Oficina</option>
              </select>
            </div>

            {/* ========================================== */}
            {/* EVALUACIONES */}
            {/* ========================================== */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
              {/* Limpieza del Suelo */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                  🧹 Limpieza del Suelo
                </label>
                <select
                  name="floor_cleaning"
                  value={formData.floor_cleaning}
                  onChange={handleChange}
                  className="block w-full rounded-xl border border-slate-200 p-2.5 bg-white text-sm focus:outline-none focus:border-[#002B7A] focus:ring-1 focus:ring-[#002B7A] transition-all text-slate-800"
                >
                  <option value="bueno">✅ Limpio / Adecuado (5★)</option>
                  <option value="malo">
                    ❌ Sucio / Requiere Limpieza (1★)
                  </option>
                </select>
              </div>

              {/* Iluminación */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                  💡 Iluminación
                </label>
                <select
                  name="lighting_status"
                  value={formData.lighting_status}
                  onChange={handleChange}
                  className="block w-full rounded-xl border border-slate-200 p-2.5 bg-white text-sm focus:outline-none focus:border-[#002B7A] focus:ring-1 focus:ring-[#002B7A] transition-all text-slate-800"
                >
                  <option value="bueno">✅ Funcional (5★)</option>
                  <option value="malo">❌ Foco Fundido / Sin Luz (1★)</option>
                </select>
              </div>
            </div>

            {/* ========================================== */}
            {/* ASIGNACIÓN DE TÉCNICO */}
            {/* ========================================== */}
            <div className="border-t border-slate-100 pt-4">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#CDB170]"></span>
                🔧 Asignación Inmediata de Personal
              </label>
              <select
                name="assigned_to_id"
                value={formData.assigned_to_id}
                onChange={handleChange}
                className="block w-full rounded-xl border border-[#CDB170]/40 p-2.5 bg-amber-50/20 text-sm focus:outline-none focus:border-[#002B7A] focus:ring-1 focus:ring-[#002B7A] transition-all text-slate-800 font-medium"
              >
                <option value="unassigned">
                  ⏳ Dejar pendiente (Sin asignar)
                </option>
                {technicians.map((tech) => (
                  <option key={tech.id} value={tech.id}>
                    👤 {tech.name} (
                    {tech.role === "admin" ? "Administrador" : "Técnico"})
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-400 mt-1">
                Si asignas ahora, el técnico recibirá una notificación inmediata
              </p>
            </div>

            {/* ========================================== */}
            {/* DESCRIPCIÓN */}
            {/* ========================================== */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                📝 Descripción del Problema
              </label>
              <textarea
                name="comments"
                value={formData.comments}
                onChange={handleChange}
                placeholder="Detalla la incidencia aquí..."
                rows={3}
                className="block w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:outline-none focus:border-[#002B7A] focus:ring-1 focus:ring-[#002B7A] transition-all text-slate-800 placeholder-slate-400"
                required
              />
            </div>

            {/* ========================================== */}
            {/* EVIDENCIA FOTOGRÁFICA */}
            {/* ========================================== */}
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-5 text-center hover:bg-slate-50 transition-colors cursor-pointer relative group">
              <label className="cursor-pointer flex flex-col items-center justify-center gap-1">
                <span className="material-symbols-outlined text-slate-400 group-hover:text-[#002B7A] transition-colors text-2xl">
                  add_a_photo
                </span>
                <span className="text-sm font-bold text-[#002B7A] hover:underline mt-1">
                  📸 Cargar evidencia fotográfica
                </span>
                <span className="text-xs text-slate-400">
                  PNG, JPG o JPEG (máx 5MB)
                </span>
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
                  📎 {selectedFile.name}
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="ml-2 text-red-500 hover:text-red-700"
                  >
                    <span className="material-symbols-outlined text-sm">
                      close
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* ========================================== */}
            {/* BOTONES DE ACCIÓN */}
            {/* ========================================== */}
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
                  "💾 Guardar Reporte"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// NOTAS PARA EL DESPLIEGUE:
// ==========================================
//
// 1. ENDPOINTS UTILIZADOS:
//    - GET /api/users → Lista de técnicos
//    - POST /api/reports → Crear nuevo reporte
//
// 2. PERMISOS:
//    - Admin y Coordinator pueden crear reportes
//    - Se valida en el backend
//
// 3. VALIDACIONES CLIENTE:
//    - Archivo máximo 5MB
//    - Todos los campos obligatorios
//
// 4. ESTRUCTURA DEL FORMULARIO:
//    - Multipart/form-data (soporta imágenes)
//    - Asignación opcional de técnico
//    - Evaluación de limpieza e iluminación
//
// ==========================================
