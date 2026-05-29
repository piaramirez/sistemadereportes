// ==========================================
// ARCHIVO: frontend/app/login/page.tsx
// AUTOR: Pedro Antonio Ramírez Alcántara
// MATERIA: Vinculación Empresarial
// GRUPO: 2007 (2026-II)
// DOCENTE: Aarón Velasco Agustín
// CARRERA: Ingeniería en Computación - FES Aragón
// FUNCIÓN: Página de autenticación - Login de usuarios
// ==========================================

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import apiClient from "@/lib/axios";

// ==========================================
// CONSTANTES
// ==========================================

// Credenciales por defecto para desarrollo (útil para pruebas rápidas)
// En producción, se recomienda no tener valores por defecto
const DEFAULT_EMAIL = "pia@edusync.com";
const DEFAULT_PASSWORD = "admin123";

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export default function LoginPage() {
  const router = useRouter();

  // Estados del formulario
  const [email, setEmail] = useState(DEFAULT_EMAIL);
  const [password, setPassword] = useState(DEFAULT_PASSWORD);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ==========================================
  // FUNCIÓN DE LOGIN
  // ==========================================

  /**
   * Maneja el inicio de sesión del usuario
   * - Envía credenciales al backend
   * - Guarda token y datos del usuario en localStorage
   * - Redirige al dashboard
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Usar apiClient para la petición
      const response = await apiClient.post("/api/auth/login", {
        email,
        password,
      });

      // Verificar respuesta exitosa
      if (response.data && response.data.access_token) {
        // Guardar token
        localStorage.setItem("token", response.data.access_token);

        // Guardar datos del usuario
        const userData = response.data.user;

        // Enriquecer datos del usuario con información adicional
        const sessionUser = {
          id: userData?.id || "",
          name:
            userData?.name ||
            (email.includes("admin") ? "Administrador" : "Usuario"),
          email: userData?.email || email,
          role:
            userData?.role ||
            (email.includes("admin") ? "admin" : "technician"),
          // Iniciales para avatar (opcional)
          initials: userData?.name
            ? userData.name
                .split(" ")
                .map((n: string) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)
            : email.includes("admin")
              ? "AD"
              : "US",
        };

        localStorage.setItem("user", JSON.stringify(sessionUser));

        // Redirigir al dashboard
        router.push("/dashboard");
      } else {
        setError("Respuesta inválida del servidor");
      }
    } catch (err: any) {
      console.error("Error en login:", err);

      // Manejar errores específicos
      if (err.response?.status === 401) {
        setError("Email o contraseña incorrectos");
      } else if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err.code === "ERR_NETWORK") {
        setError(
          "No se pudo conectar con el servidor. Verifica que el backend esté corriendo en http://localhost:8000",
        );
      } else {
        setError("Error al iniciar sesión. Intenta nuevamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // RENDERIZADO PRINCIPAL
  // ==========================================

  return (
    <main className="min-h-screen bg-[#002B7A] bg-gradient-to-br from-[#002B7A] to-[#00143A] flex items-center justify-center p-4">
      {/* Contenedor del formulario */}
      <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm border-t-4 border-[#CDB170]">
        {/* ========================================== */}
        {/* HEADER CON LOGO UNAM */}
        {/* ========================================== */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-2">
            <Image
              src="/images/logo_unam.png"
              alt="Logo UNAM"
              width={80}
              height={80}
              priority
              className="drop-shadow-md"
            />
          </div>
          <h1 className="text-3xl font-bold text-[#002B7A] mb-1">EduInspect</h1>
          <p className="text-gray-500 text-sm font-medium">
            Sistema de Reportes
          </p>
          <div className="w-12 h-1 bg-[#CDB170] mx-auto mt-2 rounded-full"></div>
          <p className="text-xs text-gray-400 mt-2">FES Aragón - UNAM</p>
        </div>

        {/* ========================================== */}
        {/* FORMULARIO DE LOGIN */}
        {/* ========================================== */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Campo de correo electrónico */}
          <div>
            <label className="block text-xs font-semibold text-[#002B7A] mb-1 uppercase tracking-wider">
              📧 Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-gray-800 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CDB170] focus:border-transparent transition-all text-sm"
              placeholder="ejemplo@edusync.com"
              required
              disabled={loading}
            />
          </div>

          {/* Campo de contraseña */}
          <div>
            <label className="block text-xs font-semibold text-[#002B7A] mb-1 uppercase tracking-wider">
              🔒 Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 text-gray-800 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CDB170] focus:border-transparent transition-all text-sm"
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>

          {/* Mensaje de error */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-2.5 rounded-r-xl text-xs font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">error</span>
              {error}
            </div>
          )}

          {/* Botón de submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#002B7A] text-white py-2.5 rounded-xl font-bold text-sm hover:bg-[#CDB170] hover:text-[#002B7A] transition-all duration-300 shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Iniciando sesión...
              </>
            ) : (
              "Iniciar Sesión"
            )}
          </button>
        </form>

        {/* ========================================== */}
        {/* CREDENCIALES DE PRUEBA */}
        {/* ========================================== */}
        <div className="text-center mt-6 text-[11px] text-gray-600 bg-[#F1E9D7] p-2.5 rounded-xl border border-[#e2d6b5]">
          <p className="font-bold text-[#002B7A] mb-0.5">
            🔐 Credenciales de prueba:
          </p>
          <p className="font-mono bg-white/50 rounded py-0.5 px-1 inline-block text-xs">
            pia@edusync.com / admin123
          </p>
          <p className="text-[10px] text-gray-500 mt-1">
            (Administrador del sistema)
          </p>
        </div>

        {/* ========================================== */}
        {/* FOOTER INSTITUCIONAL */}
        {/* ========================================== */}
        <div className="text-center mt-4">
          <p className="text-[9px] text-gray-400">
            © {new Date().getFullYear()} - FES Aragón UNAM
          </p>
        </div>
      </div>
    </main>
  );
}

// ==========================================
// NOTAS PARA EL DESPLIEGUE:
// ==========================================
//
// 1. ENDPOINT UTILIZADO:
//    - POST /api/auth/login → Autenticación de usuarios
//
// 2. USUARIOS POR DEFECTO (BD):
//    - Admin: pia@edusync.com / admin123
//    - Coordinador: coordinador@edusync.com / Unam26!#
//    - Técnico: tecnico@edusync.com / Unam26!#
//    - Inspector: inspector@edusync.com / Unam26!#
//
// 3. FLUJO DE AUTENTICACIÓN:
//    1. Usuario envía email y password
//    2. Backend valida credenciales
//    3. Retorna JWT token y datos del usuario
//    4. Frontend guarda en localStorage
//    5. Redirige a /dashboard
//
// 4. SEGURIDAD:
//    - Las contraseñas se envían en texto plano pero sobre HTTPS
//    - El token JWT se almacena en localStorage (susceptible a XSS)
//    - En producción, considerar usar cookies HttpOnly
//
// 5. PARA DESARROLLO LOCAL:
//    - Asegurar backend en http://localhost:8000
//    - Si usas otro puerto, cambiar en apiClient
//
// ==========================================
