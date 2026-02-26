// API configuration
// In development, uses localhost:4000
// In production (Firebase), uses the Cloud Function URL
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export const API_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/api/login`,
  LOGOUT: `${API_BASE_URL}/api/logout`,
  ME: `${API_BASE_URL}/api/me`,
  PRODUCTS: `${API_BASE_URL}/api/products`,
  ADMIN_PRODUCTS: `${API_BASE_URL}/api/admin/products`,
  ADMIN_ANALYTICS: `${API_BASE_URL}/api/admin/analytics`,
} as const;
