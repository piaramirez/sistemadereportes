// ==========================================
// ARCHIVO: frontend/config/api.ts
// AUTOR: Pedro Antonio Ramírez Alcántara
// MATERIA: Vinculación Empresarial
// GRUPO: 2007 (2026-II)
// DOCENTE: Aarón Velasco Agustín
// CARRERA: Ingeniería en Computación - FES Aragón
// FUNCIÓN: Configuración centralizada de URLs de la API
// ==========================================

/**
 * ==========================================
 * URL BASE DE LA API
 * ==========================================
 *
 * NEXT_PUBLIC_API_URL: Variable de entorno para cada entorno
 * - Desarrollo local: no se define (usa fallback)
 * - Producción (Vercel): se define automáticamente
 * - Docker: se define como "http://backend:8000"
 *
 * El prefijo NEXT_PUBLIC_ es OBLIGATORIO para que Next.js
 * exponga la variable al navegador (cliente).
 *
 * ORDEN DE PRIORIDAD:
 * 1. process.env.NEXT_PUBLIC_API_URL (si está definida)
 * 2. "http://localhost:8000" (fallback para desarrollo)
 *
 * EJEMPLOS POR ENTORNO:
 * - Local: http://localhost:8000
 * - Vercel: "" o "/api" (relativo a la misma URL)
 * - Docker: http://backend:8000
 * - Producción personalizada: https://api.eduinspect.com
 */

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * ==========================================
 * FUNCIÓN AUXILIAR PARA CONSTRUIR URLs
 * ==========================================
 *
 * getApiUrl(endpoint) recibe un endpoint y devuelve la URL completa.
 * Útil para usar con fetch() directamente cuando no se quiere usar
 * el cliente axios.
 *
 * @param endpoint - Ruta del endpoint (ej: "/api/users")
 * @returns URL completa con la base incluida
 *
 * @example
 * getApiUrl('/api/users')
 * // Retorna: "http://localhost:8000/api/users"
 *
 * getApiUrl('/api/reports/1/comments')
 * // Retorna: "http://localhost:8000/api/reports/1/comments"
 */

export const getApiUrl = (endpoint: string) => `${API_URL}${endpoint}`;

// ==========================================
// USO EN LA APLICACIÓN:
// ==========================================

// Opción 1: En componentes (con fetch directo)
// --------------------------------------------
// import { getApiUrl } from '@/config/api';
//
// const response = await fetch(getApiUrl('/api/users'), {
//   headers: { Authorization: `Bearer ${token}` }
// });

// Opción 2: Con apiClient (recomendado)
// --------------------------------------------
// import apiClient from '@/lib/axios';
//
// const response = await apiClient.get('/api/users');
// // apiClient ya tiene configurada la baseURL = API_URL

// Opción 3: Importar solo la URL base
// --------------------------------------------
// import { API_URL } from '@/config/api';
//
// const response = await fetch(`${API_URL}/api/users`);

// ==========================================
// VARIABLES DE ENTORNO NECESARIAS:
// ==========================================

// Archivo: .env.local (desarrollo local - opcional)
// --------------------------------------------
// NEXT_PUBLIC_API_URL=http://localhost:8000
// (no es obligatorio, usa el fallback automáticamente)

// Archivo: .env.production (producción - opcional)
// --------------------------------------------
// NEXT_PUBLIC_API_URL=https://api.midominio.com

// En Vercel (Dashboard):
// --------------------------------------------
// Variable: NEXT_PUBLIC_API_URL
// Valor: (dejar vacío para usar rutas relativas)
//
// O si el backend está en otro dominio:
// Valor: https://api.eduinspect.com

// En Docker Compose (docker-compose.yml):
// --------------------------------------------
// environment:
//   - NEXT_PUBLIC_API_URL=http://backend:8000

// ==========================================
// NOTAS DE SEGURIDAD:
// ==========================================
//
// 1. Las variables NEXT_PUBLIC_* son visibles en el navegador
//    No poner secretos (passwords, keys) aquí
//
// 2. Para secretos del backend (DB, JWT), usar variables sin NEXT_PUBLIC_
//    Ej: DATABASE_URL, SECRET_KEY (solo en el servidor)
//
// 3. En producción, asegurar HTTPS para las comunicaciones
//
// 4. Usar apiClient (lib/axios.ts) para manejo automático de tokens
//    y errores de autenticación

// ==========================================
// CHECKLIST DE DEPLOYMENT:
// ==========================================
//
// ☐ Verificar que la variable está configurada en el entorno
// ☐ Probar que el frontend se comunica con el backend
// ☐ Para Vercel: dejar vacío (rutas relativas)
// ☐ Para Docker: usar el nombre del servicio backend
// ☐ Para producción separada: usar dominio completo con HTTPS
//
// ==========================================
