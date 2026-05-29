// ==========================================
// ARCHIVO: frontend/app/layout.tsx
// AUTOR: Pedro Antonio Ramírez Alcántara
// MATERIA: Vinculación Empresarial
// GRUPO: 2007 (2026-II)
// DOCENTE: Aarón Velasco Agustín
// CARRERA: Ingeniería en Computación - FES Aragón
// FUNCIÓN: Layout raíz de la aplicación con fuentes Geist de Next.js
// ==========================================

// ==========================================
// IMPORTACIONES DE TIPOS Y FUENTES
// ==========================================

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// ==========================================
// CONFIGURACIÓN DE FUENTES GOOGLE (GEIST)
// ==========================================

// Fuente Geist Sans (variable, moderna y optimizada)
// - variable: CSS variable para usar en Tailwind
// - subsets: ["latin"] → solo caracteres latinos
// - weight: opcional, se puede especificar si no se usa variable
const geistSans = Geist({
  variable: "--font-geist-sans", // CSS variable: var(--font-geist-sans)
  subsets: ["latin"], // Soporte para caracteres latinos
  display: "swap", // Muestra fuente de respaldo mientras carga
});

// Fuente Geist Mono (monospace para código)
// Ideal para números, códigos, terminal, etc.
const geistMono = Geist_Mono({
  variable: "--font-geist-mono", // CSS variable: var(--font-geist-mono)
  subsets: ["latin"],
  display: "swap",
});

// ==========================================
// METADATA DE LA APLICACIÓN
// ==========================================
// ¡IMPORTANTE! Actualizar estos valores con los correctos
// para la aplicación EduInspect

export const metadata: Metadata = {
  // Título y configuración
  title: {
    default: "EduInspect - Sistema de Reportes", // Título por defecto
    template: "%s | EduInspect", // Template para páginas hijas
  },

  // Descripción para SEO
  description:
    "Sistema de gestión de incidencias e inspecciones de la FES Aragón - UNAM",

  // Palabras clave
  keywords: [
    "EduInspect",
    "Reportes",
    "Incidencias",
    "FES Aragón",
    "UNAM",
    "Mantenimiento",
  ],

  // Autor
  authors: [{ name: "Pedro Antonio Ramírez Alcántara" }],

  // Tema de color (UNAM Blue)
  themeColor: "#002B7A",

  // Iconos
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },

  // Open Graph (redes sociales)
  openGraph: {
    title: "EduInspect - Sistema de Reportes",
    description: "Gestión de incidencias e inspecciones FES Aragón UNAM",
    type: "website",
    locale: "es_MX",
    siteName: "EduInspect",
  },

  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "EduInspect - Sistema de Reportes",
    description: "Gestión de incidencias e inspecciones FES Aragón UNAM",
  },

  // Viewport config (responsive)
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
};

// ==========================================
// COMPONENTE ROOT LAYOUT
// ==========================================

/**
 * RootLayout - Layout raíz de la aplicación
 *
 * Características:
 * - Aplica fuentes Geist (Sans y Mono) mediante CSS variables
 * - Configura altura completa (h-full) para flexibilidad
 * - Fondo base por defecto (puede sobrescribirse en páginas hijas)
 *
 * @param children - Componentes hijos a renderizar
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es" // Cambiado de "en" a "es" (español para la UNAM)
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* 
        Clases aplicadas al body:
        - min-h-full: altura mínima completa
        - flex: display flex
        - flex-col: dirección columna
        - bg-slate-100: fondo gris claro (opcional, consistente con dashboard)
      */}
      <body className="min-h-full flex flex-col bg-slate-100">{children}</body>
    </html>
  );
}

// ==========================================
// NOTAS IMPORTANTES:
// ==========================================
//
// 1. FUENTES GEIST:
//    - Geist Sans: Fuente principal (texto general, títulos)
//    - Geist Mono: Fuente monoespaciada (código, números, métricas)
//    - Usar en Tailwind: font-sans, font-mono
//    - Personalizar: agregar en tailwind.config.js
//
// 2. CONFIGURACIÓN EN TAILWIND.CONFIG.JS (recomendado):
//    extend: {
//      fontFamily: {
//        sans: ["var(--font-geist-sans)"],
//        mono: ["var(--font-geist-mono)"],
//      },
//    }
//
// 3. LAYOUTS ANIDADOS:
//    - dashboard/layout.tsx → Layout específico del panel
//    - login/layout.tsx → Layout simple sin sidebar
//    - Cada layout puede tener su propia estructura
//
// 4. RENDIMIENTO:
//    - Font display: swap → evita FOIT (Flash of Invisible Text)
//    - Subsets: latin → reduce tamaño de fuente
//    - Variable fonts → un solo archivo para todos los pesos
//
// 5. METADATA SOBREESCRITIBLE:
//    - Cada página puede exportar su propio 'metadata'
//    - Los valores aquí son el fallback por defecto
//
// ==========================================
