// frontend/src/app/login/page.tsx
"use client";
import Image from "next/image";
import { useState } from "react";

export default function LoginPage() {
  // Ajustamos el estado para que por defecto tenga tus credenciales reales creadas en Docker
  const [email, setEmail] = useState("pia@edusync.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Conexión real con tu backend de FastAPI dockerizado
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
        setError("");
        // Aquí guardas el token si tu backend te lo regresa
        if (data.access_token) {
          localStorage.setItem("token", data.access_token);
        }
        alert("¡Inicio de sesión exitoso, Goyas!");
        // window.location.href = '/dashboard'; // Descomenta cuando tengas el dashboard listo
      }
    } catch (err) {
      setError("No se pudo conectar con el servidor de la API");
    }
  };

  return (
    <main className="min-h-screen bg-unam-azul bg-gradient-to-br from-[#002B7A] to-[#00143A] flex items-center justify-center p-4">
      {/* CAMBIO: Reducido a max-w-sm para hacerlo más estético y compacto */}
      <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm border-t-4 border-unam-oro">
        {/* CABECERA CON LOGO */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-2">
            {/* Si la imagen sigue rota, revisa que esté guardada exactamente en: frontend/public/images/logo_unam.png */}
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
          <div className="w-12 h-1 bg-unam-oro mx-auto mt-2 rounded-full"></div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {/* CORRECCIÓN: Textos en gris oscuro/azul para que resalten sobre el fondo blanco */}
          <div>
            <label className="block text-xs font-semibold text-[#002B7A] mb-1 uppercase tracking-wider">
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@unam.mx"
              className="w-full px-3 py-2 text-gray-800 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-unam-oro focus:border-transparent text-sm transition-all"
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
              placeholder="••••••••"
              className="w-full px-3 py-2 text-gray-800 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-unam-oro focus:border-transparent text-sm transition-all"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-2.5 rounded-r-xl text-xs font-medium">
              {error}
            </div>
          )}

          {/* CORRECCIÓN: Botón visible Azul UNAM con texto blanco y hover que cambia a color Oro */}
          <button
            type="submit"
            className="w-full bg-[#002B7A] text-white py-2.5 rounded-xl font-bold text-sm hover:bg-[#CDB170] hover:text-[#002B7A] transition-all duration-300 shadow-md transform hover:-translate-y-0.5 mt-2"
          >
            Iniciar Sesión
          </button>
        </form>

        {/* Caja de credenciales actualizada para tu usuario de pruebas de la BD */}
        <div className="text-center mt-6 text-[11px] text-gray-600 bg-[#F1E9D7] p-2.5 rounded-xl border border-[#e2d6b5]">
          <p className="font-bold text-[#002B7A] mb-0.5">
            Credenciales de acceso real (BD):
          </p>
          <p className="font-mono bg-white/50 rounded py-0.5 px-1 inline-block">
            pia@edusync.com / admin123
          </p>
        </div>
      </div>
    </main>
  );
}
