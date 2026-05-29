// ==========================================
// frontend/config/api.ts
// Configuración de URLs del backend
// Autor: Pedro Antonio Ramírez Alcántara
// ==========================================

// URL base de la API
// En desarrollo: http://localhost:8000
// En producción: se define en Vercel como ""
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Función para construir URLs completas
// Uso: getApiUrl('/api/users') -> http://localhost:8000/api/users
export const getApiUrl = (endpoint: string) => `${API_URL}${endpoint}`;
