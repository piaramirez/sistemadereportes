// ==========================================
// ARCHIVO: frontend/app/dashboard/reports/[id]/edit/page.tsx
// AUTOR: Pedro Antonio Ramírez Alcántara
// MATERIA: Vinculación Empresarial
// GRUPO: 2007 (2026-II)
// DOCENTE: Aarón Velasco Agustín
// CARRERA: Ingeniería en Computación - FES Aragón
// FUNCIÓN: Página de edición de reportes
// ==========================================

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import apiClient from "@/lib/axios";

// ==========================================
// INTERFACES / TIPOS
// ==========================================

interface ReportFormData {
  reporter_name: string;
  location_type: string;
  building: string;
  location: string;
  comments: string;
  assigned_technician: string;
  floor_cleaning_rating?: number;
  lighting_rating?: number;
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export default function EditReportPage({
  params,
}: Readonly<{
  params: { id: string };
}>) {
  const router = useRouter();
  const { id } = params; // ✅ CORREGIDO - Acceso directo, sin use()

  // ==========================================
  // ESTADOS
  // ==========================================

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState<ReportFormData>({
    reporter_name: "",
    location_type: "classroom",
    building: "",
    location: "",
    comments: "",
    assigned_technician: "",
    floor_cleaning_rating: undefined,
    lighting_rating: undefined,
  });

  // ==========================================
  // EFECTOS
  // ==========================================

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      router.push("/login");
      return;
    }

    const user = JSON.parse(userData);
    setUser(user);

    // Verificar permisos (solo admin o coordinator pueden editar)
    const role = user.role?.toLowerCase();
    if (role !== "admin" && role !== "coordinator") {
      router.push(`/dashboard/reports/${id}`);
      return;
    }

    const fetchReport = async () => {
      try {
        const response = await apiClient.get(`/api/reports/${id}`);
        if (response.data) {
          setFormData({
            reporter_name: response.data.reporter_name || "",
            location_type: response.data.location_type || "classroom",
            building: response.data.building || "",
            location: response.data.location || "",
            comments: response.data.comments || "",
            assigned_technician: response.data.assigned_technician || "",
            floor_cleaning_rating: response.data.floor_cleaning_rating,
            lighting_rating: response.data.lighting_rating,
          });
        }
      } catch (error) {
        console.error("Error al cargar el reporte:", error);
        alert("No se pudo cargar el reporte para editar.");
        router.push(`/dashboard/reports/${id}`);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [router, id]);

  // ==========================================
  // FUNCIONES
  // ==========================================

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = value ? parseInt(value) : undefined;
    setFormData((prev) => ({ ...prev, [name]: numValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await apiClient.put(`/api/reports/${id}`, formData);
      alert("Reporte actualizado correctamente");
      router.push(`/dashboard/reports/${id}`);
    } catch (error) {
      console.error("Error al actualizar:", error);
      alert("No se pudo actualizar el reporte.");
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // RENDERIZADO CONDICIONAL
  // ==========================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#002B7A] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // ==========================================
  // RENDERIZADO PRINCIPAL
  // ==========================================

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-900 pb-12">
      {/* Navbar */}
      <nav className="border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <Link
                href={`/dashboard/reports/${id}`}
                className="p-2 text-slate-400 hover:text-[#002B7A] transition-colors"
              >
                <span className="material-symbols-outlined">arrow_back</span>
              </Link>
              <h1 className="text-xl font-bold text-slate-800">
                Editar Reporte
              </h1>
            </div>
            <div className="text-xs text-slate-400">
              ID: {id}
            </div>
          </div>
        </div>
      </nav>

      {/* Formulario de edición */}
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información básica */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-black text-[#002B7A] mb-4">
              Información del Reporte
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Nombre del Reportero
                </label>
                <input
                  type="text"
                  name="reporter_name"
                  value={formData.reporter_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#002B7A] focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Tipo de Ubicación
                </label>
                <select
                  name="location_type"
                  value={formData.location_type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#002B7A] focus:border-transparent"
                >
                  <option value="classroom">Salón de Clases</option>
                  <option value="laboratory">Laboratorio</option>
                  <option value="office">Oficina</option>
                  <option value="restroom">Sanitario</option>
                  <option value="hallway">Pasillo</option>
                  <option value="other">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Edificio
                </label>
                <input
                  type="text"
                  name="building"
                  value={formData.building}
                  onChange={handleChange}
                  placeholder="Ej: Edificio A, Biblioteca, etc."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#002B7A] focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Ubicación Específica
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Ej: Aula 101, Cubículo 3, etc."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#002B7A] focus:border-transparent"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Técnico Asignado
                </label>
                <input
                  type="text"
                  name="assigned_technician"
                  value={formData.assigned_technician}
                  onChange={handleChange}
                  placeholder="Nombre del técnico responsable"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#002B7A] focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Evaluaciones */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-black text-[#002B7A] mb-4">
              Evaluaciones Físicas
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Limpieza del Suelo (1-5)
                </label>
                <input
                  type="number"
                  name="floor_cleaning_rating"
                  value={formData.floor_cleaning_rating || ""}
                  onChange={handleNumberChange}
                  min="1"
                  max="5"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#002B7A] focus:border-transparent"
                />
                <p className="text-xs text-slate-400 mt-1">1=Muy malo, 5=Excelente</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Iluminación (1-5)
                </label>
                <input
                  type="number"
                  name="lighting_rating"
                  value={formData.lighting_rating || ""}
                  onChange={handleNumberChange}
                  min="1"
                  max="5"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#002B7A] focus:border-transparent"
                />
                <p className="text-xs text-slate-400 mt-1">1=No funciona, 5=Excelente</p>
              </div>
            </div>
          </div>

          {/* Descripción */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-black text-[#002B7A] mb-4">
              Descripción del Problema
            </h2>

            <div>
              <textarea
                name="comments"
                value={formData.comments}
                onChange={handleChange}
                rows={6}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#002B7A] focus:border-transparent resize-none"
                required
              />
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3 justify-end">
            <Link
              href={`/dashboard/reports/${id}`}
              className="px-6 py-2.5 border border-slate-300 rounded-xl text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 transition-all"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-[#002B7A] hover:bg-[#CDB170] text-white hover:text-[#002B7A] rounded-xl text-sm font-bold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {saving ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}