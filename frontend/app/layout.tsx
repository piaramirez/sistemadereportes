import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EduInspect - Sistema de Reportes",
  description: "Gestión de incidencias e inspecciones FES Aragón - UNAM",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-slate-100">{children}</body>
    </html>
  );
}
