// ==========================================
// ARCHIVO: frontend/app/dashboard/staff/page.tsx
// AUTOR: Pedro Antonio Ramírez Alcántara
// MATERIA: Vinculación Empresarial
// GRUPO: 2007 (2026-II)
// DOCENTE: Aarón Velasco Agustín
// CARRERA: Ingeniería en Computación - FES Aragón
// FUNCIÓN: Gestión de personal - Lista de usuarios, CRUD, búsqueda
// ==========================================

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/axios";

// ==========================================
// INTERFACES / TIPOS
// ==========================================

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export default function StaffPage() {
  const router = useRouter();

  // Estados
  const [staff, setStaff] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Estado para nuevo usuario
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "technician",
    password: "Unam26!#",
  });

  // ==========================================
  // EFECTOS
  // ==========================================

  useEffect(() => {
    fetchStaff();
  }, []);

  // ==========================================
  // FUNCIONES DE CRUD
  // ==========================================

  /**
   * Obtiene la lista de todos los usuarios del sistema
   */
  const fetchStaff = async () => {
    try {
      const res = await apiClient.get("/api/users");
      setStaff(res.data);
    } catch (error) {
      console.error("Error al cargar personal:", error);
      alert("Error al cargar la lista de personal");
    }
  };

  /**
   * Crea un nuevo usuario en el sistema
   */
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await apiClient.post("/api/users", newUser);
      alert("✓ Usuario creado exitosamente");
      setShowModal(false);
      // Resetear formulario
      setNewUser({
        name: "",
        email: "",
        role: "technician",
        password: "Unam26!#",
      });
      // Recargar lista
      fetchStaff();
    } catch (error: any) {
      console.error("Error al crear usuario:", error);
      const errorMsg = error.response?.data?.detail || "Error al crear usuario";
      alert(`❌ ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // FILTRO DE BÚSQUEDA
  // ==========================================

  const filteredStaff = staff.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // ==========================================
  // FUNCIONES AUXILIARES UI
  // ==========================================

  /**
   * Retorna la etiqueta legible del rol
   */
  const getRoleLabel = (role: string) => {
    const roles: Record<string, string> = {
      admin: "Administrador",
      coordinator: "Coordinador",
      technician: "Técnico",
      inspector: "Inspector",
    };
    return roles[role] || role;
  };

  /**
   * Retorna los colores según el rol del usuario
   */
  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: "bg-purple-100 text-purple-700",
      coordinator: "bg-blue-100 text-blue-700",
      technician: "bg-amber-100 text-amber-700",
      inspector: "bg-green-100 text-green-700",
    };
    return colors[role] || "bg-slate-100 text-slate-600";
  };

  // ==========================================
  // RENDERIZADO PRINCIPAL
  // ==========================================

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
      {/* ========================================== */}
      {/* HEADER */}
      {/* ========================================== */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          👥 Gestionar Personal
        </h1>
        <p className="text-slate-500 font-medium">
          Auditoría y control de usuarios del sistema
        </p>
      </div>

      {/* ========================================== */}
      {/* BUSCADOR */}
      {/* ========================================== */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
            search
          </span>
          <input
            className="w-full outline-none text-slate-800 placeholder:text-slate-400 pl-10 pr-3 py-1"
            placeholder="Buscar por nombre o cargo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* ========================================== */}
      {/* TABLA DE PERSONAL */}
      {/* ========================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <h3 className="font-bold text-slate-800 text-lg">
            Listado de Personal
          </h3>
          <button
            onClick={() => setShowModal(true)}
            className="bg-[#002B7A] text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-[#001F5C] transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">add</span>
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
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">
                  Estado
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-12 text-center text-sm text-slate-400 italic"
                  >
                    No se encontraron usuarios que coincidan con la búsqueda
                  </td>
                </tr>
              ) : (
                filteredStaff.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-bold text-slate-800">
                      {user.name}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded-full uppercase ${getRoleColor(user.role)}`}
                      >
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold ${
                          user.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            user.is_active ? "bg-green-500" : "bg-red-500"
                          }`}
                        ></span>
                        {user.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() =>
                          router.push(`/dashboard/staff/${user.id}`)
                        }
                        className="text-[#002B7A] font-bold text-sm hover:underline flex items-center gap-1 ml-auto"
                      >
                        <span className="material-symbols-outlined text-sm">
                          edit
                        </span>
                        Editar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Resumen de resultados */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/30 text-right text-xs text-slate-400">
          Mostrando {filteredStaff.length} de {staff.length} usuarios
        </div>
      </div>

      {/* ========================================== */}
      {/* MODAL: AGREGAR USUARIO */}
      {/* ========================================== */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-lg">
                ➕ Agregar Nuevo Usuario
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              {/* Nombre completo */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  👤 Nombre completo
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#002B7A] focus:border-transparent text-slate-800"
                  value={newUser.name}
                  onChange={(e) =>
                    setNewUser({ ...newUser, name: e.target.value })
                  }
                  placeholder="Ej: Juan Pérez"
                />
              </div>

              {/* Correo electrónico */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  📧 Correo electrónico
                </label>
                <input
                  type="email"
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#002B7A] focus:border-transparent text-slate-800"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                  placeholder="ejemplo@edusync.com"
                />
              </div>

              {/* Rol / Cargo */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  🎯 Rol / Cargo
                </label>
                <select
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#002B7A] focus:border-transparent bg-white text-slate-800"
                  value={newUser.role}
                  onChange={(e) =>
                    setNewUser({ ...newUser, role: e.target.value })
                  }
                >
                  <option value="admin">👑 Administrador</option>
                  <option value="coordinator">📋 Coordinador</option>
                  <option value="technician">🔧 Técnico</option>
                  <option value="inspector">🔍 Inspector</option>
                </select>
              </div>

              {/* Contraseña inicial */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  🔑 Contraseña inicial
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#002B7A] focus:border-transparent bg-slate-50 text-slate-800"
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser({ ...newUser, password: e.target.value })
                  }
                />
                <p className="text-xs text-slate-400 mt-1">
                  Por defecto: <span className="font-mono">Unam26!#</span>
                </p>
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[#002B7A] text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-[#001F5C] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Creando...
                    </>
                  ) : (
                    "Crear Usuario"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// NOTAS PARA EL DESPLIEGUE:
// ==========================================
//
// 1. ENDPOINTS UTILIZADOS:
//    - GET /api/users → Lista de usuarios
//    - POST /api/users → Crear nuevo usuario
//
// 2. PERMISOS REQUERIDOS:
//    - Admin y Coordinator pueden acceder a esta vista
//    - La creación de usuarios requiere autenticación
//
// 3. ROLES DISPONIBLES:
//    - admin: Acceso total
//    - coordinator: Puede gestionar reportes y personal
//    - technician: Recibe asignaciones de reportes
//    - inspector: Crea reportes
//
// 4. CONTRASEÑA POR DEFECTO:
//    - Unam26!# (cumple con políticas de seguridad UNAM)
//    - El usuario debe cambiarla en su primer inicio de sesión
//
// 5. ESTADO DE USUARIO:
//    - Activo: puede iniciar sesión
//    - Inactivo: cuenta deshabilitada
//
// ==========================================
