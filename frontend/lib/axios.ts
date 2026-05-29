// ==========================================
// ARCHIVO: frontend/lib/axios.ts
// AUTOR: Pedro Antonio Ramírez Alcántara
// MATERIA: Vinculación Empresarial
// GRUPO: 2007 (2026-II)
// DOCENTE: Aarón Velasco Agustín
// CARRERA: Ingeniería en Computación - FES Aragón
// FUNCIÓN: Cliente HTTP centralizado para comunicarse con el backend
// ==========================================

import axios from "axios";
import { API_URL } from "@/config/api";

/**
 * ==========================================
 * CREACIÓN DEL CLIENTE AXIOS
 * ==========================================
 *
 * Este cliente se usa en TODAS las peticiones al backend.
 * Centraliza:
 * - URL base (configurable por entorno)
 * - Headers por defecto
 * - Interceptores para tokens y errores
 *
 * VENTAJAS:
 * - No repetir el token en cada petición
 * - No repetir la URL base
 * - Manejo centralizado de errores 401
 * - Fácil de mantener y modificar
 */

const apiClient = axios.create({
  // URL base de la API (desde config/api.ts)
  baseURL: API_URL,

  // Headers por defecto para todas las peticiones
  headers: {
    "Content-Type": "application/json",
  },

  // Timeout opcional (30 segundos)
  timeout: 30000,
});

// ==========================================
// INTERCEPTOR DE SOLICITUDES (REQUEST)
// ==========================================
// Se ejecuta ANTES de cada petición HTTP
// Agrega automáticamente el token JWT a los headers

apiClient.interceptors.request.use(
  (config) => {
    // Obtener token del localStorage
    const token = localStorage.getItem("token");

    // Si existe token, agregarlo al header Authorization
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Opcional: Log para debugging (descomentar si es necesario)
    // console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);

    return config;
  },
  (error) => {
    // Error en la configuración de la petición
    console.error("[API Request Error]", error);
    return Promise.reject(error);
  },
);

// ==========================================
// INTERCEPTOR DE RESPUESTAS (RESPONSE)
// ==========================================
// Se ejecuta DESPUÉS de cada respuesta HTTP
// Maneja errores globales como 401 (no autorizado)

apiClient.interceptors.response.use(
  // Respuesta exitosa (códigos 2xx)
  (response) => {
    // Opcional: Log para debugging
    // console.log(`[API Response] ${response.status} ${response.config.url}`);
    return response;
  },

  // Error en la respuesta (códigos 4xx, 5xx)
  (error) => {
    // Verificar si es error de autenticación (token expirado o inválido)
    if (error.response?.status === 401) {
      console.warn(
        "[Auth Error] Token inválido o expirado. Redirigiendo a login...",
      );

      // Limpiar datos de sesión
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Redirigir al login (solo en cliente, no en SSR)
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }

    // Opcional: manejar otros códigos de error globalmente
    if (error.response?.status === 403) {
      console.warn("[Permission Error] No tienes permisos para esta acción");
    }

    if (error.response?.status === 500) {
      console.error("[Server Error] Error interno del servidor");
    }

    // Reenviar el error para que cada componente lo maneje específicamente
    return Promise.reject(error);
  },
);

// ==========================================
// EXPORTACIÓN DEL CLIENTE
// ==========================================

export default apiClient;

// ==========================================
// USO EN COMPONENTES:
// ==========================================
//
// EJEMPLO 1: GET (obtener datos)
// --------------------------------------------
// import apiClient from '@/lib/axios';
//
// const fetchUsers = async () => {
//   try {
//     const response = await apiClient.get('/api/users');
//     setUsers(response.data);
//   } catch (error) {
//     console.error('Error:', error);
//   }
// };
//
// EJEMPLO 2: POST (crear datos)
// --------------------------------------------
// const createUser = async (userData) => {
//   try {
//     const response = await apiClient.post('/api/users', userData);
//     return response.data;
//   } catch (error) {
//     throw error;
//   }
// };
//
// EJEMPLO 3: PUT (actualizar)
// --------------------------------------------
// const updateReport = async (id, data) => {
//   await apiClient.put(`/api/reports/${id}/status`, data);
// };
//
// EJEMPLO 4: PATCH (actualización parcial)
// --------------------------------------------
// const updateUser = async (id, data) => {
//   await apiClient.patch(`/api/users/${id}/toggle-active`, data);
// };
//
// EJEMPLO 5: DELETE (eliminar)
// --------------------------------------------
// const deleteReport = async (id) => {
//   await apiClient.delete(`/api/reports/${id}`);
// };
//
// EJEMPLO 6: FormData (subir archivos)
// --------------------------------------------
// const formData = new FormData();
// formData.append('file', selectedFile);
//
// await apiClient.post('/api/reports', formData, {
//   headers: { 'Content-Type': 'multipart/form-data' }
// });

// ==========================================
// NOTAS IMPORTANTES:
// ==========================================
//
// 1. EL TOKEN ES AUTOMÁTICO:
//    No necesitas agregar manualmente el token en cada petición
//    El interceptor lo hace por ti
//
// 2. MANEJO DE ERRORES 401:
//    Si el token expira, el usuario es redirigido automáticamente al login
//    No necesitas manejar esto en cada componente
//
// 3. COMPATIBILIDAD:
//    Este cliente funciona en:
//    - Componentes del cliente ('use client')
//    - No funciona en Server Components (por localStorage)
//
// 4. EXTENSIONES POSIBLES:
//    - Agregar refresh token automático
//    - Agregar logging centralizado
//    - Agregar métricas de rendimiento
//    - Agregar cancelación de peticiones duplicadas
//
// 5. PARA DEPURACIÓN:
//    Descomentar los console.log en los interceptores
//    Para ver todas las peticiones en consola
//
// ==========================================
