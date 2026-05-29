"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function StaffPage() {
  const router = useRouter();
  const [staff, setStaff] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get("http://localhost:8000/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStaff(res.data);
    } catch (error) {
      console.error("Error al cargar personal:", error);
    }
  };

  const filteredStaff = staff.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    // Fondo claro para igualar el Dashboard
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Gestionar Personal
        </h1>
        <p className="text-slate-500 font-medium">
          Auditoría y control de usuarios del sistema
        </p>
      </div>

      {/* Buscador */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <input
          className="w-full outline-none text-slate-700 placeholder:text-slate-400"
          placeholder="Buscar por nombre o cargo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Tabla - Estructura exacta al Dashboard */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <h3 className="font-bold text-slate-800 text-lg">
            Listado de Personal
          </h3>
          {/* Botón añadido como en el Dashboard */}
          <button className="bg-[#002B7A] text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-[#001F5C] transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">add</span>{" "}
            Agregar Usuario
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">
                  Nombre
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">
                  Rol
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStaff.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/80">
                  <td className="px-6 py-4 text-sm font-bold text-slate-800">
                    {user.name}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-600 uppercase">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => router.push(`/dashboard/staff/${user.id}`)}
                      className="text-[#002B7A] font-bold text-sm hover:underline"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
