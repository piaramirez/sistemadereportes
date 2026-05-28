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
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md mt-10">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Levantar Nuevo Reporte - UNAM
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Infraestructura */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Edificio
            </label>
            <input
              type="text"
              name="building_name"
              value={formData.building_name}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-gray-50"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Ubicación / Salón
            </label>
            <input
              type="text"
              name="classroom_name"
              value={formData.classroom_name}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-gray-50"
              required
            />
          </div>
        </div>

        {/* Tipo de Área */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Tipo de Espacio
          </label>
          <select
            name="location_type"
            value={formData.location_type}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md p-2 border bg-white"
          >
            <option value="classroom">Salón de Clases</option>
            <option value="bathroom">Baños</option>
            <option value="common_area">Área Común</option>
            <option value="lab">Laboratorio</option>
            <option value="office">Oficina</option>
          </select>
        </div>

        {/* Evaluaciones rápidas de infraestructura */}
        <div className="grid grid-cols-2 gap-4 border-t pt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Limpieza del Suelo
            </label>
            <select
              name="floor_cleaning"
              value={formData.floor_cleaning}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md p-2 border bg-white"
            >
              <option value="bueno">Limpio / Adecuado (5★)</option>
              <option value="malo">Sucio / Requiere Limpieza (1★)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Iluminación
            </label>
            <select
              name="lighting_status"
              value={formData.lighting_status}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md p-2 border bg-white"
            >
              <option value="bueno">Funcional (5★)</option>
              <option value="malo">Foco Fundido / Sin Luz (1★)</option>
            </select>
          </div>
        </div>

        {/* Asignación Inmediata de Técnico */}
        <div className="border-t pt-4">
          <label className="block text-sm font-medium text-purple-700 font-bold">
            Asignación Inmediata de Personal
          </label>
          <select
            name="assigned_to_id"
            value={formData.assigned_to_id}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md p-2 border border-purple-300 bg-white"
          >
            <option value="unassigned">Dejar pendiente (Sin asignar)</option>
            {technicians.map((tech) => (
              <option key={tech.id} value={tech.id}>
                {tech.name} ({tech.role.toUpperCase()})
              </option>
            ))}
          </select>
        </div>

        {/* Comentarios */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Descripción del Problema
          </label>
          <textarea
            name="comments"
            value={formData.comments}
            onChange={handleChange}
            placeholder="asd..."
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
            required
          />
        </div>

        {/* Subida de Evidencia Fotográfica */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 cursor-pointer">
          <label className="cursor-pointer">
            <span className="text-blue-600 font-medium">
              Cargar evidencia fotográfica
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
          {selectedFile && (
            <p className="mt-2 text-sm text-green-600 bg-green-50 py-1 rounded-md font-mono">
              {selectedFile.name}
            </p>
          )}
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400"
          >
            {loading ? "Sincronizando con Postgres..." : "Guardar Reporte"}
          </button>
        </div>
      </form>
    </div>
  );
}
