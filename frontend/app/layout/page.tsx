// ==========================================
// ARCHIVO: frontend/app/layout.tsx
// AUTOR: Pedro Antonio Ramírez Alcántara
// MATERIA: Vinculación Empresarial
// GRUPO: 2007 (2026-II)
// DOCENTE: Aarón Velasco Agustín
// CARRERA: Ingeniería en Computación - FES Aragón
// FUNCIÓN: Layout raíz de la aplicación - Metadata y estructura base
// ==========================================

// ==========================================
// IMPORACIÓN DE TIPOS Y ESTILOS GLOBALES
// ==========================================

import type { Metadata } from "next";
import "./globals.css";

// ==========================================
// METADATA DE LA APLICACIÓN
// ==========================================
// Estos metadatos se usan para SEO y para mostrar
// información en las pestañas del navegador.
//
// - title: Título que aparece en la pestaña del navegador
// - description: Descripción que aparece en resultados de búsqueda
// - icons: Configuración de favicon (opcional)
// - viewport: Configuración de viewport para responsive (opcional)

export const metadata: Metadata = {
  // Título principal de la aplicación
  title: {
    default: "EduInspect - Sistema de Reportes", // Título por defecto
    template: "%s | EduInspect", // Template para páginas hijas
  },

  // Descripción para SEO
  description:
    "Sistema de gestión de incidencias e inspecciones de la FES Aragón - UNAM",

  // Palabras clave para SEO
  keywords: [
    "EduInspect",
    "Reportes",
    "Incidencias",
    "FES Aragón",
    "UNAM",
    "Mantenimiento",
  ],

  // Autor de la aplicación
  authors: [
    {
      name: "Pedro Antonio Ramírez Alcántara",
      url: "https://github.com/tuusuario",
    },
  ],

  // Tema de color para navegadores móviles
  themeColor: "#002B7A", // Azul UNAM

  // Color de fondo para la barra de direcciones en Chrome Android
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },

  // Iconos de la aplicación (favicon)
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },

  // Open Graph (para compartir en redes sociales)
  openGraph: {
    title: "EduInspect - Sistema de Reportes",
    description: "Gestión de incidencias e inspecciones FES Aragón",
    type: "website",
    locale: "es_MX",
    siteName: "EduInspect",
  },

  // Twitter Card (para compartir en Twitter)
  twitter: {
    card: "summary_large_image",
    title: "EduInspect - Sistema de Reportes",
    description: "Gestión de incidencias e inspecciones FES Aragón",
  },
};

// ==========================================
// COMPONENTE ROOT LAYOUT
// ==========================================
// Este es el layout raíz que envuelve todas las páginas
// No se puede usar 'use client' aquí porque es un Server Component
// Los layouts son componentes que comparten estado entre páginas

/**
 * RootLayout - Componente principal de la aplicación
 *
 * @param children - Componentes hijos que se renderizarán dentro del layout
 * @returns Estructura HTML base de la aplicación
 *
 * Características:
 * - Define el idioma español (lang="es")
 * - Aplica estilos globales desde globals.css
 * - Establece color de fondo base (bg-slate-100)
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // html: Elemento raíz del documento HTML
    // lang="es" → Define el idioma español para accesibilidad y SEO
    <html lang="es">
      {/* 
        body: Cuerpo del documento
        className="bg-slate-100" → Fondo gris claro por defecto
        Los colores y estilos específicos se manejan en cada página
      */}
      <body className="bg-slate-100">
        {/* Aquí se renderiza el contenido de cada página */}
        {children}
      </body>
    </html>
  );
}

// ==========================================
// NOTAS IMPORTANTES:
// ==========================================
//
// 1. ESTE ARCHIVO ES OBLIGATORIO EN NEXT.JS APP ROUTER:
//    - Debe estar en app/layout.tsx
//    - No puede tener 'use client' (es Server Component por defecto)
//    - Define la estructura HTML base
//    - Es compartido entre todas las páginas
//
// 2. METADATA:
//    - Soporta SEO dinámico
//    - Puede sobreescribirse por página usando `generateMetadata`
//    - Para páginas específicas, exportar metadata en la página hija
//
// 3. ESTILOS GLOBALES:
//    - Los estilos de globals.css aplican a toda la app
//    - Configura Tailwind CSS y estilos base
//    - Material Symbols se importan en cada página (o en un layout separado)
//
// 4. BUENAS PRÁCTICAS:
//    - No poner lógica de cliente aquí (auth, fetch, etc.)
//    - Usar layouts anidados para diferentes secciones
//    - Ejemplo: dashboard/layout.tsx para el panel de control
//
// ==========================================
