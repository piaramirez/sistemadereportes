export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const getApiUrl = (endpoint: string) => `${API_URL}${endpoint}`;
