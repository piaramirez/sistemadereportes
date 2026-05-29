// ==========================================
// ARCHIVO: frontend/app/page.tsx
// AUTOR: Pedro Antonio Ramírez Alcántara
// MATERIA: Vinculación Empresarial
// GRUPO: 2007 (2026-II)
// DOCENTE: Aarón Velasco Agustín
// CARRERA: Ingeniería en Computación - FES Aragón
// FUNCIÓN: Página de inicio / Landing page de EduInspect
// ==========================================

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export default function HomePage() {
  const router = useRouter();

  // Verificar si el usuario ya está autenticado
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    // Si ya hay sesión activa, redirigir al dashboard
    if (token && user) {
      router.replace("/dashboard");
    }
  }, [router]);

  // ==========================================
  // RENDERIZADO PRINCIPAL
  // ==========================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#002B7A] to-[#00143A] font-sans">
      {/* Contenido principal */}
      <main className="flex flex-col items-center justify-center min-h-screen px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo UNAM */}
          <div className="mb-8 flex justify-center">
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-full">
              <Image
                src="/images/logo_unam.png"
                alt="Logo UNAM"
                width={120}
                height={120}
                priority
                className="drop-shadow-xl"
              />
            </div>
          </div>

          {/* Título principal */}
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 tracking-tight">
            EduInspect
          </h1>

          {/* Línea decorativa */}
          <div className="w-24 h-1 bg-[#CDB170] mx-auto mb-6 rounded-full"></div>

          {/* Subtítulo */}
          <p className="text-xl md:text-2xl text-white/90 mb-4 font-light">
            Sistema de Gestión de Reportes e Incidencias
          </p>

          {/* Institución */}
          <p className="text-md text-[#CDB170] mb-12 font-semibold tracking-wide">
            FES Aragón - Universidad Nacional Autónoma de México
          </p>

          {/* Descripción */}
          <div className="max-w-2xl mx-auto mb-12">
            <p className="text-white/80 text-lg leading-relaxed">
              Plataforma integral para la gestión de mantenimiento, reportes de
              incidencias y auditoría de espacios académicos.
            </p>
          </div>

          {/* Características */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center hover:bg-white/15 transition-all">
              <div className="text-4xl mb-3">📋</div>
              <h3 className="text-white font-semibold mb-2">
                Reportes Rápidos
              </h3>
              <p className="text-white/70 text-sm">
                Genera reportes de incidencias en minutos
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center hover:bg-white/15 transition-all">
              <div className="text-4xl mb-3">🔧</div>
              <h3 className="text-white font-semibold mb-2">
                Asignación Eficiente
              </h3>
              <p className="text-white/70 text-sm">
                Asigna técnicos y da seguimiento
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center hover:bg-white/15 transition-all">
              <div className="text-4xl mb-3">📊</div>
              <h3 className="text-white font-semibold mb-2">
                Auditoría Completa
              </h3>
              <p className="text-white/70 text-sm">
                Historial y estadísticas en tiempo real
              </p>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="bg-[#CDB170] hover:bg-[#b89e5a] text-[#002B7A] font-bold py-3 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl text-lg"
            >
              Iniciar Sesión
            </Link>
            <Link
              href="/dashboard/reports"
              className="bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 text-white font-bold py-3 px-8 rounded-xl transition-all duration-300 text-lg"
            >
              Ver Reportes Públicos
            </Link>
          </div>

          {/* Footer */}
          <footer className="mt-16 pt-8 border-t border-white/10 text-center">
            <p className="text-white/50 text-sm">
              © {new Date().getFullYear()} FES Aragón - UNAM. Todos los derechos
              reservados.
            </p>
            <p className="text-white/40 text-xs mt-2">
              Desarrollado por Pedro Antonio Ramírez Alcántara
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}

// ==========================================
// NOTAS PARA EL DESPLIEGUE:
// ==========================================
//
// 1. REDIRECCIÓN AUTOMÁTICA:
//    - Si el usuario ya tiene sesión (token en localStorage)
//    - Se redirige automáticamente al dashboard
//    - Evita que usuarios autenticados vean el landing
//
// 2. RUTAS:
//    - /login → Página de inicio de sesión
//    - /dashboard → Panel principal (requiere autenticación)
//    - /dashboard/reports → Listado de reportes
//
// 3. ESTILOS:
//    - Gradiente azul UNAM (from-[#002B7A] to-[#00143A])
//    - Acentos en dorado UNAM (#CDB170)
//    - Efectos de blur y transparencia
//
// 4. SEO:
//    - Esta es la página principal (root route "/")
//    - Configurar metadata en layout.tsx
//
// ==========================================
