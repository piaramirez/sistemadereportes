"use client";

import { useState } from "react";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("pia@edusync.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:8000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.detail || "Email o contraseña incorrectos");
      } else {
        const data = await response.json();

        if (data.access_token) {
          localStorage.setItem("token", data.access_token);
        }

        // Estructura de sesión basada en tus credenciales
        const sessionUser = {
          name:
            data.user?.name ||
            (email.startsWith("admin") || email.startsWith("pia")
              ? "Pedro Ramírez"
              : "Usuario FES"),
          role:
            data.user?.role ||
            (email.startsWith("admin") || email.startsWith("pia")
              ? "admin"
              : "technician"),
          initials:
            email.startsWith("admin") || email.startsWith("pia") ? "PR" : "UN",
        };

        localStorage.setItem("user", JSON.stringify(sessionUser));
        window.location.href = "/dashboard";
      }
    } catch (err) {
      setError("No se pudo conectar con el servidor de la API.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#002B7A] bg-gradient-to-br from-[#002B7A] to-[#00143A] flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm border-t-4 border-[#CDB170]">
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
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#002B7A] mb-1 uppercase tracking-wider">
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-gray-800 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CDB170] text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#002B7A] mb-1 uppercase tracking-wider">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 text-gray-800 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CDB170] text-sm"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-2.5 rounded-r-xl text-xs font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#002B7A] text-white py-2.5 rounded-xl font-bold text-sm hover:bg-[#CDB170] hover:text-[#002B7A] transition-all duration-300 shadow-md"
          >
            {loading ? "Iniciando..." : "Iniciar Sesión"}
          </button>
        </form>

        <div className="text-center mt-6 text-[11px] text-gray-600 bg-[#F1E9D7] p-2.5 rounded-xl border border-[#e2d6b5]">
          <p className="font-bold text-[#002B7A] mb-0.5">
            Credenciales del administrador (BD):
          </p>
          <p className="font-mono bg-white/50 rounded py-0.5 px-1 inline-block">
            pia@edusync.com / admin123
          </p>
        </div>
      </div>
    </main>
  );
}
