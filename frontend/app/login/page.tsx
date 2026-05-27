"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import axios from "axios";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.post("/api/auth/login", {
        email,
        password,
      });

      const { access_token, user } = response.data;
      localStorage.setItem("token", access_token);
      localStorage.setItem("user", JSON.stringify(user));

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-unam-blue to-unam-darkblue">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-96">
        <div className="flex justify-center gap-4 mb-6">
          <div className="w-16 h-16 bg-unam-blue rounded-full flex items-center justify-center text-white font-bold text-xl">
            U
          </div>
          <div className="w-px bg-gray-300"></div>
          <div className="w-16 h-16 bg-unam-gold rounded-full flex items-center justify-center text-white font-bold text-xl">
            F
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center text-unam-blue">
          EduInspect
        </h1>
        <p className="text-center text-gray-500 mb-6">Sistema de Reportes</p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-unam-blue focus:border-unam-blue outline-none"
              placeholder="usuario@ejemplo.com"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-unam-blue focus:border-unam-blue outline-none"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="mb-4 p-2 bg-red-100 text-red-700 rounded text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-unam-blue text-white py-2 rounded-lg font-semibold hover:bg-unam-darkblue transition-colors disabled:opacity-50"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-gray-400">
          <p>Credenciales de prueba:</p>
          <p>admin@edusync.com / admin123</p>
        </div>
      </div>
    </div>
  );
}
